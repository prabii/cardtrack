const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { body, validationResult, query } = require('express-validator');
const Statement = require('../models/Statement');
const Cardholder = require('../models/Cardholder');
const Transaction = require('../models/Transaction');
const { verifyToken } = require('../middleware/auth');
const StatementProcessor = require('../services/statementProcessor');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/statements');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `statement-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Apply authentication middleware to all routes
router.use(verifyToken);

// @route   GET /api/statements
// @desc    Get all statements with optional filters
router.get('/', [
  query('cardholder').optional().isMongoId(),
  query('status').optional().isIn(['uploaded', 'processing', 'processed', 'failed', 'pending']),
  query('month').optional().isString(),
  query('year').optional().isInt({ min: 2020, max: 2030 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { cardholder, status, month, year, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { isDeleted: false };

    // Add filters
    if (cardholder) query.cardholder = cardholder;
    if (status) query.status = status;
    if (month) query.month = month;
    if (year) query.year = year;

    const statements = await Statement.find(query)
      .populate('cardholder', 'name email')
      .populate('uploadedBy', 'name email')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Statement.countDocuments(query);

    // Get statistics
    const stats = await Statement.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const overdueCount = await Statement.countDocuments({
      deadline: { $lt: new Date() },
      status: { $ne: 'processed' },
      isDeleted: false
    });

    res.json({
      success: true,
      data: statements,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      stats: {
        byStatus: stats,
        overdueCount
      }
    });
  } catch (error) {
    console.error('Get statements error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/statements/:id
// @desc    Get single statement by ID
router.get('/:id', async (req, res) => {
  try {
    const statement = await Statement.findById(req.params.id)
      .populate('cardholder', 'name email phone')
      .populate('uploadedBy', 'name email')
      .populate('processedBy', 'name email');

    if (!statement || statement.isDeleted) {
      return res.status(404).json({ success: false, message: 'Statement not found' });
    }

    res.json({
      success: true,
      data: statement.getPublicInfo()
    });
  } catch (error) {
    console.error('Get statement error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/statements
// @desc    Upload new statement
router.post('/', upload.single('statement'), [
  body('cardholder', 'Cardholder ID is required').isMongoId(),
  body('month', 'Month is required').notEmpty().trim(),
  body('year', 'Year is required').isInt({ min: 2020, max: 2030 }),
  body('timePeriod.startDate', 'Start date is required').isISO8601().toDate(),
  body('timePeriod.endDate', 'End date is required').isISO8601().toDate(),
  body('cardDigits', 'Card digits are required').matches(/^\d{4}$/),
  body('bankName', 'Bank name is required').notEmpty().trim(),
  body('cardNumber', 'Card number is required').notEmpty().trim(),
  body('deadline', 'Deadline is required').isISO8601().toDate()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'PDF file is required' });
    }

    const {
      cardholder,
      month,
      year,
      timePeriod,
      cardDigits,
      bankName,
      cardNumber,
      deadline
    } = req.body;

    // Verify cardholder exists
    const cardholderExists = await Cardholder.findById(cardholder);
    if (!cardholderExists || cardholderExists.isDeleted) {
      return res.status(404).json({ success: false, message: 'Cardholder not found' });
    }

    // Check for duplicate statement
    const existingStatement = await Statement.findOne({
      cardholder,
      month,
      year,
      cardDigits,
      isDeleted: false
    });

    if (existingStatement) {
      // Delete uploaded file
      await fs.unlink(req.file.path);
      return res.status(400).json({ 
        success: false, 
        message: 'Statement for this month and card already exists' 
      });
    }

    // Create statement
    const statement = new Statement({
      cardholder,
      month,
      year,
      timePeriod: {
        startDate: new Date(timePeriod.startDate),
        endDate: new Date(timePeriod.endDate)
      },
      cardDigits,
      bankName,
      cardNumber,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      deadline: new Date(deadline),
      uploadedBy: req.user.id
    });

    await statement.save();

    // Auto-process statement if uploaded by member (extract transactions automatically)
    let processingResult = null;
    if (req.user.role === 'member') {
      try {
        console.log('Auto-processing statement for member upload');
        const StatementProcessor = require('../services/statementProcessor');
        processingResult = await StatementProcessor.processStatement(statement._id.toString(), req.user.id);
        console.log('Auto-processing completed:', processingResult);
      } catch (processError) {
        console.error('Auto-processing failed (non-critical):', processError);
        // Don't fail the upload if processing fails - user can process manually later
      }
    }

    // Populate the response
    await statement.populate([
      { path: 'cardholder', select: 'name email' },
      { path: 'uploadedBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: processingResult ? 
        `Statement uploaded and processed successfully! Found ${processingResult.transactions || 0} transactions.` :
        'Statement uploaded successfully. Please process it to extract transactions.',
      data: statement.getPublicInfo(),
      autoProcessed: !!processingResult,
      transactionsFound: processingResult?.transactions || 0
    });
  } catch (error) {
    console.error('Upload statement error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/statements/:id/status
// @desc    Update statement status
router.put('/:id/status', [
  body('status', 'Status is required').isIn(['uploaded', 'processing', 'processed', 'failed', 'pending']),
  body('processingError').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const statement = await Statement.findById(req.params.id);
    if (!statement || statement.isDeleted) {
      return res.status(404).json({ success: false, message: 'Statement not found' });
    }

    const { status, processingError } = req.body;

    await statement.updateStatus(status, req.user.id);
    
    if (processingError) {
      statement.processingError = processingError;
      await statement.save();
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: statement.getPublicInfo()
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/statements/:id/extracted-data
// @desc    Update extracted data from statement processing
router.put('/:id/extracted-data', [
  body('extractedData.totalTransactions').optional().isInt({ min: 0 }),
  body('extractedData.totalAmount').optional().isFloat({ min: 0 }),
  body('extractedData.cardLimit').optional().isFloat({ min: 0 }),
  body('extractedData.availableLimit').optional().isFloat({ min: 0 }),
  body('extractedData.outstandingAmount').optional().isFloat({ min: 0 }),
  body('extractedData.minimumPayment').optional().isFloat({ min: 0 }),
  body('extractedData.dueDate').optional().isISO8601().toDate()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const statement = await Statement.findById(req.params.id);
    if (!statement || statement.isDeleted) {
      return res.status(404).json({ success: false, message: 'Statement not found' });
    }

    const { extractedData } = req.body;

    // Update extracted data
    Object.keys(extractedData).forEach(key => {
      if (extractedData[key] !== undefined) {
        statement.extractedData[key] = extractedData[key];
      }
    });

    await statement.save();

    res.json({
      success: true,
      message: 'Extracted data updated successfully',
      data: statement.getPublicInfo()
    });
  } catch (error) {
    console.error('Update extracted data error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/statements/:id
// @desc    Delete statement (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const statement = await Statement.findById(req.params.id);
    if (!statement || statement.isDeleted) {
      return res.status(404).json({ success: false, message: 'Statement not found' });
    }

    // Delete physical file
    try {
      await fs.unlink(statement.filePath);
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
      // Continue with soft delete even if file deletion fails
    }

    await statement.softDelete(req.user.id);

    res.json({
      success: true,
      message: 'Statement deleted successfully'
    });
  } catch (error) {
    console.error('Delete statement error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/statements/:id/download
// @desc    Download statement file
router.get('/:id/download', async (req, res) => {
  try {
    const statement = await Statement.findById(req.params.id);
    if (!statement || statement.isDeleted) {
      return res.status(404).json({ success: false, message: 'Statement not found' });
    }

    if (!statement.filePath) {
      console.error('Statement missing filePath:', statement._id);
      return res.status(404).json({ success: false, message: 'File path not found for this statement' });
    }

    if (!statement.fileName) {
      console.error('Statement missing fileName:', statement._id);
      return res.status(404).json({ success: false, message: 'File name not found for this statement' });
    }

    // Check if file exists
    try {
      await fs.access(statement.filePath);
    } catch (error) {
      console.error('File access error:', error);
      console.error('File path:', statement.filePath);
      return res.status(404).json({ 
        success: false, 
        message: `File not found at path: ${statement.filePath}` 
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', statement.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${statement.fileName}"`);
    
    // Send file
    res.download(statement.filePath, statement.fileName, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Error downloading file: ' + err.message });
        }
      }
    });
  } catch (error) {
    console.error('Download statement error:', error);
    console.error('Error stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// @route   GET /api/statements/overdue
// @desc    Get overdue statements
router.get('/overdue', async (req, res) => {
  try {
    const overdueStatements = await Statement.findOverdue()
      .populate('cardholder', 'name email phone')
      .populate('uploadedBy', 'name email')
      .sort({ deadline: 1 });

    res.json({
      success: true,
      data: overdueStatements
    });
  } catch (error) {
    console.error('Get overdue statements error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/statements/cardholder/:cardholderId
// @desc    Get statements for specific cardholder
router.get('/cardholder/:cardholderId', async (req, res) => {
  try {
    const statements = await Statement.findByCardholder(req.params.cardholderId)
      .populate('uploadedBy', 'name email')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: statements
    });
  } catch (error) {
    console.error('Get cardholder statements error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/statements/:id/process
// @desc    Process statement (extract data from PDF)
router.post('/:id/process', async (req, res) => {
  try {
    const statementId = req.params.id;
    const userId = req.user?.id || req.user?.userId || req.user?._id;
    
    // Validate statement ID
    if (!statementId || statementId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Statement ID is required'
      });
    }
    
    // Validate user ID
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    console.log('Processing statement:', { statementId, userId });
    const result = await StatementProcessor.processStatement(statementId, userId);
    res.json(result);
  } catch (error) {
    console.error('Process statement error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to process statement',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST /api/statements/process-all
// @desc    Process all pending statements
router.post('/process-all', async (req, res) => {
  try {
    const result = await StatementProcessor.processAllPending(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Process all statements error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to process statements' 
    });
  }
});

// @route   GET /api/statements/:id/transactions
// @desc    Get statement with transactions
router.get('/:id/transactions', async (req, res) => {
  try {
    const result = await StatementProcessor.getStatementWithTransactions(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Get statement transactions error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to get statement transactions' 
    });
  }
});

// @route   GET /api/statements/processing/stats
// @desc    Get processing statistics
router.get('/processing/stats', async (req, res) => {
  try {
    const result = await StatementProcessor.getProcessingStats();
    res.json(result);
  } catch (error) {
    console.error('Get processing stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to get processing statistics' 
    });
  }
});

// @route   POST /api/statements/:id/reprocess
// @desc    Reprocess statement
router.post('/:id/reprocess', async (req, res) => {
  try {
    const result = await StatementProcessor.reprocessStatement(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Reprocess statement error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to reprocess statement' 
    });
  }
});

module.exports = router;
