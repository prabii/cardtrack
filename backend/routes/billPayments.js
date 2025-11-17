const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const BillPayment = require('../models/BillPayment');
const Bank = require('../models/Bank');
const Cardholder = require('../models/Cardholder');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/bill-payments/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed'));
    }
  }
});

// @route   GET /api/bill-payments
// @desc    Get all bill payments with filtering and pagination
// @access  Private
router.get('/', verifyToken, async (req, res) => {
  try {
    const {
      cardholder,
      bank,
      status,
      requestType,
      billerCategory,
      priority,
      assignedTo,
      requestedBy,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'requestDetails.requestedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (cardholder) filter.cardholder = cardholder;
    if (bank) filter.bank = bank;
    if (status) filter.status = status;
    if (requestType) filter.requestType = requestType;
    if (billerCategory) filter['billDetails.billerCategory'] = billerCategory;
    if (priority) filter['requestDetails.priority'] = priority;
    if (assignedTo) filter['processingDetails.assignedTo'] = assignedTo;
    if (requestedBy) filter['requestDetails.requestedBy'] = requestedBy;
    
    if (startDate || endDate) {
      filter['requestDetails.requestedAt'] = {};
      if (startDate) filter['requestDetails.requestedAt'].$gte = new Date(startDate);
      if (endDate) filter['requestDetails.requestedAt'].$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const billPayments = await BillPayment.find(filter)
      .populate('cardholder', 'name email phone')
      .populate('bank', 'bankName cardNumber cardType')
      .populate('requestDetails.requestedBy', 'name email')
      .populate('processingDetails.assignedTo', 'name email')
      .populate('verification.verifiedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BillPayment.countDocuments(filter);

    // Get statistics (with error handling)
    let stats = null;
    try {
      const statsResult = await BillPayment.getStatistics(filter);
      stats = statsResult && statsResult.length > 0 ? statsResult[0] : null;
    } catch (statsError) {
      console.error('Error getting statistics:', statsError);
      // Continue without stats rather than failing the whole request
      stats = null;
    }

    res.json({
      success: true,
      data: billPayments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      },
      stats: stats || {
        totalRequests: 0,
        pendingRequests: 0,
        inProgressRequests: 0,
        completedRequests: 0,
        failedRequests: 0,
        totalAmount: 0,
        averageProcessingTime: 0
      }
    });
  } catch (error) {
    console.error('Error fetching bill payments:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching bill payments',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   GET /api/bill-payments/:id
// @desc    Get single bill payment
// @access  Private
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const billPayment = await BillPayment.findById(req.params.id)
      .populate('cardholder', 'name email phone address')
      .populate('bank', 'bankName cardNumber cardType')
      .populate('requestDetails.requestedBy', 'name email')
      .populate('processingDetails.assignedTo', 'name email')
      .populate('verification.verifiedBy', 'name email')
      .populate('notifications.sentTo', 'name email')
      .populate('attachments.uploadedBy', 'name email');

    if (!billPayment) {
      return res.status(404).json({
        success: false,
        message: 'Bill payment not found'
      });
    }

    res.json({
      success: true,
      data: billPayment
    });
  } catch (error) {
    console.error('Error fetching bill payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bill payment'
    });
  }
});

// @route   POST /api/bill-payments
// @desc    Create new bill payment request (Members can raise requests)
// @access  Private - All authenticated users can create requests
router.post('/', verifyToken, upload.single('attachment'), [
  body('cardholder', 'Cardholder ID is required').isMongoId(),
  body('bank', 'Bank ID is required').isMongoId(),
  body('requestType', 'Request type is required').isIn(['bill_payment', 'withdrawal', 'transfer', 'purchase']),
  body('billDetails.billerName', 'Biller name is required').notEmpty().trim(),
  body('billDetails.billerAccount', 'Biller account is required').notEmpty().trim(),
  body('billDetails.billerCategory', 'Biller category is required').isIn(['utilities', 'telecom', 'insurance', 'credit_card', 'loan', 'other']),
  body('paymentDetails.amount', 'Payment amount is required').isFloat({ min: 0.01 }),
  body('paymentDetails.paymentMethod', 'Payment method is required').isIn(['credit_card', 'debit_card', 'bank_transfer', 'cash']),
  body('paymentDetails.dueDate', 'Due date is required').isISO8601().toDate()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      cardholder,
      bank,
      requestType,
      billDetails,
      paymentDetails,
      requestNotes,
      priority,
      estimatedProcessingTime
    } = req.body;

    // Check if cardholder exists
    const cardholderExists = await Cardholder.findById(cardholder);
    if (!cardholderExists) {
      return res.status(404).json({
        success: false,
        message: 'Cardholder not found'
      });
    }

    // Check if bank exists
    const bankExists = await Bank.findById(bank);
    if (!bankExists) {
      return res.status(404).json({
        success: false,
        message: 'Bank not found'
      });
    }

    const billPayment = new BillPayment({
      cardholder,
      bank,
      requestType,
      billDetails,
      paymentDetails,
      requestDetails: {
        requestedBy: req.user.id,
        requestNotes: requestNotes || '',
        priority: priority || 'medium',
        estimatedProcessingTime: estimatedProcessingTime || 24
      }
    });

    // Handle attachment if uploaded
    if (req.file) {
      billPayment.attachments.push({
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: req.user.id
      });
    }

    await billPayment.save();
    await billPayment.populate('cardholder bank requestDetails.requestedBy');

    res.status(201).json({
      success: true,
      data: billPayment,
      message: 'Bill payment request created successfully'
    });
  } catch (error) {
    console.error('Error creating bill payment:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate entry found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating bill payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/bill-payments/:id/assign
// @desc    Assign bill payment to operator
// @access  Private
router.put('/:id/assign', verifyToken, async (req, res) => {
  try {
    const { notes = '' } = req.body;

    const billPayment = await BillPayment.findById(req.params.id);
    if (!billPayment) {
      return res.status(404).json({
        success: false,
        message: 'Bill payment not found'
      });
    }

    await billPayment.assignToOperator(req.user.id, notes);
    await billPayment.populate('processingDetails.assignedTo', 'name email');

    res.json({
      success: true,
      data: billPayment,
      message: 'Bill payment assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning bill payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while assigning bill payment'
    });
  }
});

// @route   PUT /api/bill-payments/:id/start-processing
// @desc    Start processing bill payment
// @access  Private
router.put('/:id/start-processing', verifyToken, async (req, res) => {
  try {
    const { notes = '' } = req.body;

    const billPayment = await BillPayment.findById(req.params.id);
    if (!billPayment) {
      return res.status(404).json({
        success: false,
        message: 'Bill payment not found'
      });
    }

    await billPayment.startProcessing(notes);

    res.json({
      success: true,
      data: billPayment,
      message: 'Bill payment processing started'
    });
  } catch (error) {
    console.error('Error starting bill payment processing:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while starting processing'
    });
  }
});

// @route   PUT /api/bill-payments/:id/complete
// @desc    Complete bill payment processing
// @access  Private
router.put('/:id/complete', verifyToken, async (req, res) => {
  try {
    const { paymentResult, notes = '' } = req.body;

    const billPayment = await BillPayment.findById(req.params.id);
    if (!billPayment) {
      return res.status(404).json({
        success: false,
        message: 'Bill payment not found'
      });
    }

    await billPayment.completeProcessing(paymentResult, notes);

    res.json({
      success: true,
      data: billPayment,
      message: 'Bill payment completed successfully'
    });
  } catch (error) {
    console.error('Error completing bill payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while completing bill payment'
    });
  }
});

// @route   PUT /api/bill-payments/:id/mark-paid
// @desc    Mark bill payment as paid (Operator action)
// @access  Private (Operator, Manager, Admin)
router.put('/:id/mark-paid', verifyToken, [
  body('gateway', 'Gateway is required').isMongoId(),
  body('transactionReference').optional().isString().trim(),
  body('notes').optional().isString().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { gateway, transactionReference, notes = '' } = req.body;

    // Check if user has permission (operator, manager, or admin)
    // If role is not in token, fetch user from database
    let userRole = req.user.role;
    if (!userRole) {
      const User = require('../models/User');
      const user = await User.findById(req.user.id || req.user.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      userRole = user.role;
    }
    
    if (!['operator', 'manager', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only operators, managers, and admins can mark payments as paid'
      });
    }

    const mongoose = require('mongoose');
    const Gateway = require('../models/Gateway');
    const GatewayTransaction = require('../models/GatewayTransaction');

    // Convert gateway ID to ObjectId (gateway should already be a valid ObjectId string from validation)
    let gatewayId;
    try {
      gatewayId = mongoose.Types.ObjectId.isValid(gateway) ? gateway : new mongoose.Types.ObjectId(gateway);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gateway ID format'
      });
    }
    const gatewayDoc = await Gateway.findById(gatewayId);
    if (!gatewayDoc) {
      return res.status(404).json({
        success: false,
        message: 'Gateway not found'
      });
    }

    const billPayment = await BillPayment.findById(req.params.id);
    if (!billPayment) {
      return res.status(404).json({
        success: false,
        message: 'Bill payment not found'
      });
    }

    // Get user ID (ensure it's a valid ObjectId)
    const userId = req.user.id || req.user.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }
    
    // Ensure userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Mark as paid
    const paymentResult = {
      transactionId: transactionReference || `TXN-${Date.now()}`,
      paymentStatus: 'success', // Valid enum values: 'success', 'failed', 'pending', 'refunded'
      gateway: gatewayDoc.name,
      gatewayId: gatewayId.toString(),
      paidAt: new Date(),
      paidBy: userId.toString()
    };

    await billPayment.completeProcessing(paymentResult, notes);

    // Create gateway transaction
    const gatewayTransaction = new GatewayTransaction({
      gateway: gatewayId,
      transactionType: 'bill',
      amount: billPayment.paymentDetails.amount,
      currency: billPayment.paymentDetails.currency || 'USD',
      description: `Bill payment: ${billPayment.billDetails?.billerName || 'Bill Payment'}`,
      reference: transactionReference || paymentResult.transactionId,
      billPayment: billPayment._id,
      cardholder: billPayment.cardholder || null,
      bank: billPayment.bank || null,
      status: 'completed',
      transactionDate: new Date(),
      completedAt: new Date(),
      notes: notes || '',
      createdBy: userId
    });

    await gatewayTransaction.save();

    await billPayment.populate('cardholder bank requestDetails.requestedBy');

    // Broadcast real-time alert that payment was completed
    try {
      const socketService = global.socketService;
      if (socketService) {
        socketService.broadcastAlert({
          id: `payment_completed_${billPayment._id}`,
          type: 'bill_payment_completed',
          priority: 'low',
          title: 'Bill Payment Completed',
          message: `Payment of ${billPayment.paymentDetails.amount} ${billPayment.paymentDetails.currency} completed`,
          details: {
            billPaymentId: billPayment._id,
            cardholder: billPayment.cardholder,
            gateway: gatewayDoc.name,
            amount: billPayment.paymentDetails.amount
          },
          roles: ['admin', 'manager', 'operator', 'member']
        });
      }
    } catch (socketError) {
      console.error('Error broadcasting payment alert:', socketError);
    }

    res.json({
      success: true,
      data: {
        billPayment,
        gatewayTransaction
      },
      message: 'Bill payment marked as paid successfully'
    });
  } catch (error) {
    console.error('Error marking bill payment as paid:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while marking bill payment as paid',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   PUT /api/bill-payments/:id/fail
// @desc    Mark bill payment as failed
// @access  Private
router.put('/:id/fail', verifyToken, async (req, res) => {
  try {
    const { failureReason, notes = '' } = req.body;

    const billPayment = await BillPayment.findById(req.params.id);
    if (!billPayment) {
      return res.status(404).json({
        success: false,
        message: 'Bill payment not found'
      });
    }

    await billPayment.failProcessing(failureReason, notes);

    res.json({
      success: true,
      data: billPayment,
      message: 'Bill payment marked as failed'
    });
  } catch (error) {
    console.error('Error failing bill payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking bill payment as failed'
    });
  }
});

// @route   PUT /api/bill-payments/:id/verify
// @desc    Verify bill payment
// @access  Private
router.put('/:id/verify', verifyToken, async (req, res) => {
  try {
    const { notes = '' } = req.body;

    const billPayment = await BillPayment.findById(req.params.id);
    if (!billPayment) {
      return res.status(404).json({
        success: false,
        message: 'Bill payment not found'
      });
    }

    await billPayment.verifyPayment(req.user.id, notes);
    await billPayment.populate('verification.verifiedBy', 'name email');

    res.json({
      success: true,
      data: billPayment,
      message: 'Bill payment verified successfully'
    });
  } catch (error) {
    console.error('Error verifying bill payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying bill payment'
    });
  }
});

// @route   POST /api/bill-payments/:id/upload
// @desc    Upload attachment for bill payment
// @access  Private
router.post('/:id/upload', verifyToken, upload.single('attachment'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const billPayment = await BillPayment.findById(req.params.id);
    if (!billPayment) {
      return res.status(404).json({
        success: false,
        message: 'Bill payment not found'
      });
    }

    const attachment = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.id
    };

    billPayment.attachments.push(attachment);
    await billPayment.save();

    res.json({
      success: true,
      data: attachment,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading file'
    });
  }
});

// @route   GET /api/bill-payments/stats/overdue
// @desc    Get overdue bill payments
// @access  Private
router.get('/stats/overdue', verifyToken, async (req, res) => {
  try {
    const overduePayments = await BillPayment.getOverduePayments();

    res.json({
      success: true,
      data: overduePayments,
      count: overduePayments.length
    });
  } catch (error) {
    console.error('Error fetching overdue payments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching overdue payments'
    });
  }
});

// @route   GET /api/bill-payments/stats/operator/:operatorId
// @desc    Get operator performance statistics
// @access  Private
router.get('/stats/operator/:operatorId', verifyToken, async (req, res) => {
  try {
    const { operatorId } = req.params;
    const { startDate, endDate } = req.query;

    const filter = { 'processingDetails.assignedTo': operatorId };
    if (startDate || endDate) {
      filter['processingDetails.assignedAt'] = {};
      if (startDate) filter['processingDetails.assignedAt'].$gte = new Date(startDate);
      if (endDate) filter['processingDetails.assignedAt'].$lte = new Date(endDate);
    }

    const stats = await BillPayment.getStatistics(filter);

    res.json({
      success: true,
      data: stats[0] || {
        totalRequests: 0,
        pendingRequests: 0,
        inProgressRequests: 0,
        completedRequests: 0,
        failedRequests: 0,
        totalAmount: 0,
        averageProcessingTime: 0
      }
    });
  } catch (error) {
    console.error('Error fetching operator stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching operator statistics'
    });
  }
});

// @route   PUT /api/bill-payments/:id
// @desc    Update bill payment
// @access  Private
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const {
      billDetails,
      paymentDetails,
      requestNotes,
      priority,
      tags
    } = req.body;

    const billPayment = await BillPayment.findById(req.params.id);
    if (!billPayment) {
      return res.status(404).json({
        success: false,
        message: 'Bill payment not found'
      });
    }

    // Update fields
    if (billDetails) billPayment.billDetails = { ...billPayment.billDetails, ...billDetails };
    if (paymentDetails) billPayment.paymentDetails = { ...billPayment.paymentDetails, ...paymentDetails };
    if (requestNotes !== undefined) billPayment.requestDetails.requestNotes = requestNotes;
    if (priority) billPayment.requestDetails.priority = priority;
    if (tags) billPayment.tags = tags;

    await billPayment.save();
    await billPayment.populate('cardholder bank requestDetails.requestedBy');

    res.json({
      success: true,
      data: billPayment,
      message: 'Bill payment updated successfully'
    });
  } catch (error) {
    console.error('Error updating bill payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating bill payment'
    });
  }
});

// @route   DELETE /api/bill-payments/:id
// @desc    Delete bill payment
// @access  Private (Admin, Manager, Member - only for their own requests)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const billPayment = await BillPayment.findById(req.params.id);
    if (!billPayment) {
      return res.status(404).json({
        success: false,
        message: 'Bill payment not found'
      });
    }

    // Check permissions: Admin and Manager can delete any pending request
    // Members can only delete their own pending requests
    const isAdminOrManager = ['admin', 'manager'].includes(req.user.role);
    const isOwner = billPayment.requestDetails?.requestedBy?.toString() === req.user.id;

    if (!isAdminOrManager && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this bill payment'
      });
    }

    // Only allow deletion of pending requests
    if (billPayment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bill payments can be deleted'
      });
    }

    await BillPayment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Bill payment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bill payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting bill payment'
    });
  }
});

module.exports = router;
