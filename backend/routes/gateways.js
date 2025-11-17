const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const Gateway = require('../models/Gateway');
const GatewayTransaction = require('../models/GatewayTransaction');

// @route   GET /api/gateways
// @desc    Get all gateways
// @access  Private
router.get('/', verifyToken, async (req, res) => {
  try {
    const gateways = await Gateway.find({ isActive: true }).sort({ name: 1 });
    
    res.json({
      success: true,
      data: gateways
    });
  } catch (error) {
    console.error('Get gateways error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/gateways/:id
// @desc    Get gateway by ID
// @access  Private
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const gateway = await Gateway.findById(req.params.id);
    
    if (!gateway) {
      return res.status(404).json({
        success: false,
        message: 'Gateway not found'
      });
    }
    
    res.json({
      success: true,
      data: gateway
    });
  } catch (error) {
    console.error('Get gateway error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/gateways/:id/dashboard
// @desc    Get gateway dashboard with summary
// @access  Private
router.get('/:id/dashboard', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const gateway = await Gateway.findById(req.params.id);
    
    if (!gateway) {
      return res.status(404).json({
        success: false,
        message: 'Gateway not found'
      });
    }
    
    // Get summary
    const summary = await GatewayTransaction.getSummary(req.params.id, startDate, endDate);
    
    // Get recent transactions
    const recentTransactions = await GatewayTransaction.find({
      gateway: req.params.id
    })
      .populate('billPayment', 'requestType billDetails paymentDetails')
      .populate('cardholder', 'name email')
      .sort({ transactionDate: -1 })
      .limit(10);
    
    res.json({
      success: true,
      data: {
        gateway,
        summary,
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Get gateway dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/gateways/:id/transactions
// @desc    Create gateway transaction (Withdrawals, Bills, Transfers, Deposits)
// @access  Private (Gateway Manager only)
router.post('/:id/transactions', verifyToken, [
  body('transactionType', 'Transaction type is required').isIn(['withdrawal', 'bill', 'transfer', 'deposit']),
  body('amount', 'Amount is required').isFloat({ min: 0.01 }),
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'INR']),
  body('description').optional().isString().trim(),
  body('reference').optional().isString().trim()
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
    
    // Check if user is gateway_manager or admin
    if (req.user.role !== 'gateway_manager' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only gateway managers can add transactions'
      });
    }
    
    const gateway = await Gateway.findById(req.params.id);
    if (!gateway) {
      return res.status(404).json({
        success: false,
        message: 'Gateway not found'
      });
    }
    
    const transaction = new GatewayTransaction({
      gateway: req.params.id,
      transactionType: req.body.transactionType,
      amount: req.body.amount,
      currency: req.body.currency || 'USD',
      description: req.body.description || '',
      reference: req.body.reference || '',
      billPayment: req.body.billPayment || null,
      cardholder: req.body.cardholder || null,
      bank: req.body.bank || null,
      status: req.body.status || 'pending',
      transactionDate: req.body.transactionDate ? new Date(req.body.transactionDate) : new Date(),
      notes: req.body.notes || '',
      createdBy: req.user.userId
    });
    
    await transaction.save();
    await transaction.populate('gateway billPayment cardholder bank createdBy');
    
    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Gateway transaction created successfully'
    });
  } catch (error) {
    console.error('Create gateway transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/gateways/:id/transactions
// @desc    Get gateway transactions
// @access  Private
router.get('/:id/transactions', verifyToken, [
  query('transactionType').optional().isIn(['withdrawal', 'bill', 'transfer', 'deposit']),
  query('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'cancelled']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { transactionType, status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { gateway: req.params.id };
    
    if (transactionType) query.transactionType = transactionType;
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) query.transactionDate.$lte = new Date(endDate);
    }
    
    const transactions = await GatewayTransaction.find(query)
      .populate('gateway billPayment cardholder bank createdBy')
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await GatewayTransaction.countDocuments(query);
    
    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get gateway transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

