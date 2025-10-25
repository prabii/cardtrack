const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Cardholder = require('../models/Cardholder');
const Statement = require('../models/Statement');
const Transaction = require('../models/Transaction');
const Bank = require('../models/Bank');
const { verifyToken } = require('../middleware/auth');
const { requirePermission, requireModuleAccess } = require('../middleware/roles');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Apply module access middleware
router.use(requireModuleAccess('cardholders'));

// @route   GET /api/cardholders
// @desc    Get all cardholders with optional search and filter
router.get('/', [
  query('search').optional().isString().trim(),
  query('status').optional().isIn(['active', 'pending', 'inactive', 'suspended']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { search, status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { isDeleted: false };

    // Add search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { fatherName: searchRegex },
        { motherName: searchRegex }
      ];
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    const cardholders = await Cardholder.find(query)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Cardholder.countDocuments(query);

    // Get statistics
    const stats = await Cardholder.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalOutstanding = await Cardholder.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalOutstanding' }
        }
      }
    ]);

    res.json({
      success: true,
      data: cardholders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      stats: {
        byStatus: stats,
        totalOutstanding: totalOutstanding[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get cardholders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/cardholders/:id
// @desc    Get single cardholder by ID
router.get('/:id', async (req, res) => {
  try {
    const cardholder = await Cardholder.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email');

    if (!cardholder || cardholder.isDeleted) {
      return res.status(404).json({ success: false, message: 'Cardholder not found' });
    }

    // Get related data
    const [statements, banks, recentTransactions] = await Promise.all([
      Statement.find({ cardholder: req.params.id }).limit(5),
      Bank.find({ cardholder: req.params.id }),
      Transaction.find({ cardholder: req.params.id }).limit(10)
    ]);

    res.json({
      success: true,
      data: {
        cardholder: cardholder.getPublicProfile(),
        statements,
        banks,
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Get cardholder error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/cardholders
// @desc    Create new cardholder
router.post('/', [
  body('name', 'Name is required').notEmpty().trim().isLength({ max: 100 }),
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
  body('phone', 'Please include a valid phone number').matches(/^\+?[\d\s\-\(\)]{10,}$/),
  body('address', 'Address is required').notEmpty().trim().isLength({ max: 500 }),
  body('dob', 'Date of birth is required').isISO8601().toDate(),
  body('fatherName', 'Father\'s name is required').notEmpty().trim().isLength({ max: 100 }),
  body('motherName', 'Mother\'s name is required').notEmpty().trim().isLength({ max: 100 }),
  body('emergencyContact.name').optional().trim().isLength({ min: 1, max: 100 }),
  body('emergencyContact.phone').optional().custom((value) => {
    if (!value || value.trim() === '') return true; // Allow empty values
    return /^\+?[\d\s\-\(\)]{10,}$/.test(value);
  }),
  body('notes').optional().trim().isLength({ max: 1000 })
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
      name,
      email,
      phone,
      address,
      dob,
      fatherName,
      motherName,
      emergencyContact,
      notes
    } = req.body;

    // Check if email already exists
    const existingCardholder = await Cardholder.findOne({ email, isDeleted: false });
    if (existingCardholder) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Set current user for middleware
    Cardholder.currentUser = req.user.id;

    const cardholder = new Cardholder({
      name,
      email,
      phone,
      address,
      dob,
      fatherName,
      motherName,
      emergencyContact,
      notes,
      createdBy: req.user.id
    });

    await cardholder.save();

    res.status(201).json({
      success: true,
      message: 'Cardholder created successfully',
      data: cardholder.getPublicProfile()
    });
  } catch (error) {
    console.error('Create cardholder error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/cardholders/:id
// @desc    Update cardholder
router.put('/:id', requirePermission('edit_cardholders'), [
  body('name').optional().trim().isLength({ max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().matches(/^\+?[\d\s\-\(\)]{10,}$/),
  body('address').optional().trim().isLength({ max: 500 }),
  body('dob').optional().isISO8601().toDate(),
  body('fatherName').optional().trim().isLength({ max: 100 }),
  body('motherName').optional().trim().isLength({ max: 100 }),
  body('emergencyContact.name').optional().trim().isLength({ max: 100 }),
  body('emergencyContact.phone').optional().matches(/^\+?[\d\s\-\(\)]{10,}$/),
  body('notes').optional().trim().isLength({ max: 1000 }),
  body('status').optional().isIn(['active', 'pending', 'inactive', 'suspended'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const cardholder = await Cardholder.findById(req.params.id);
    if (!cardholder || cardholder.isDeleted) {
      return res.status(404).json({ success: false, message: 'Cardholder not found' });
    }

    // Check if email already exists (if being updated)
    if (req.body.email && req.body.email !== cardholder.email) {
      const existingCardholder = await Cardholder.findOne({ 
        email: req.body.email, 
        isDeleted: false,
        _id: { $ne: req.params.id }
      });
      if (existingCardholder) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
    }

    // Set current user for middleware
    Cardholder.currentUser = req.user.id;

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        cardholder[key] = req.body[key];
      }
    });

    await cardholder.save();

    res.json({
      success: true,
      message: 'Cardholder updated successfully',
      data: cardholder.getPublicProfile()
    });
  } catch (error) {
    console.error('Update cardholder error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/cardholders/:id
// @desc    Soft delete cardholder
router.delete('/:id', requirePermission('delete_cardholders'), async (req, res) => {
  try {
    const cardholder = await Cardholder.findById(req.params.id);
    if (!cardholder || cardholder.isDeleted) {
      return res.status(404).json({ success: false, message: 'Cardholder not found' });
    }

    await cardholder.softDelete(req.user.id);

    res.json({
      success: true,
      message: 'Cardholder deleted successfully'
    });
  } catch (error) {
    console.error('Delete cardholder error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/cardholders/:id/status
// @desc    Update cardholder status
router.put('/:id/status', [
  body('status', 'Status is required').isIn(['active', 'pending', 'inactive', 'suspended'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const cardholder = await Cardholder.findById(req.params.id);
    if (!cardholder || cardholder.isDeleted) {
      return res.status(404).json({ success: false, message: 'Cardholder not found' });
    }

    await cardholder.updateStatus(req.body.status, req.user.id);

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: cardholder.getPublicProfile()
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/cardholders/:id/statistics
// @desc    Get cardholder statistics
router.get('/:id/statistics', async (req, res) => {
  try {
    const cardholder = await Cardholder.findById(req.params.id);
    if (!cardholder || cardholder.isDeleted) {
      return res.status(404).json({ success: false, message: 'Cardholder not found' });
    }

    const [statements, banks, transactions] = await Promise.all([
      Statement.find({ cardholder: req.params.id }),
      Bank.find({ cardholder: req.params.id }),
      Transaction.find({ cardholder: req.params.id })
    ]);

    const totalOutstanding = banks.reduce((sum, bank) => sum + bank.outstandingAmount, 0);
    const totalLimit = banks.reduce((sum, bank) => sum + bank.cardLimit, 0);
    const totalAvailable = banks.reduce((sum, bank) => sum + bank.availableLimit, 0);

    res.json({
      success: true,
      data: {
        cardholder: cardholder.getPublicProfile(),
        summary: {
          totalCards: banks.length,
          totalStatements: statements.length,
          totalTransactions: transactions.length,
          totalOutstanding,
          totalLimit,
          totalAvailable,
          utilizationPercentage: totalLimit > 0 ? ((totalOutstanding / totalLimit) * 100).toFixed(2) : 0
        },
        recentActivity: {
          lastStatement: statements[0] || null,
          lastTransaction: transactions[0] || null,
          overdueStatements: statements.filter(s => s.isOverdue).length
        }
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
