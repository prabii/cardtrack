const express = require('express');
const router = express.Router();
const Bank = require('../models/Bank');
const Transaction = require('../models/Transaction');
const Cardholder = require('../models/Cardholder');
const { verifyToken } = require('../middleware/auth');

// @route   GET /api/banks
// @desc    Get all banks with optional filtering
// @access  Private
router.get('/', verifyToken, async (req, res) => {
  try {
    const {
      cardholder,
      bankName,
      cardType,
      status,
      page = 1,
      limit = 10,
      sortBy = 'lastUpdated',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (cardholder) filter.cardholder = cardholder;
    if (bankName) filter.bankName = new RegExp(bankName, 'i');
    if (cardType) filter.cardType = cardType;
    if (status) filter.status = status;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const banks = await Bank.find(filter)
      .populate('cardholder', 'name email phone')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Bank.countDocuments(filter);

    // Calculate statistics
    const stats = await Bank.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalBanks: { $sum: 1 },
          totalLimit: { $sum: '$cardLimit' },
          totalOutstanding: { $sum: '$outstandingAmount' },
          totalAvailable: { $sum: '$availableLimit' }
        }
      }
    ]);

    res.json({
      success: true,
      data: banks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      },
      stats: stats[0] || {
        totalBanks: 0,
        totalLimit: 0,
        totalOutstanding: 0,
        totalAvailable: 0
      }
    });
  } catch (error) {
    console.error('Error fetching banks:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching banks'
    });
  }
});

// @route   GET /api/banks/:id
// @desc    Get single bank with transactions
// @access  Private
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const bank = await Bank.findById(req.params.id)
      .populate('cardholder', 'name email phone address dob fatherName motherName');

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Bank not found'
      });
    }

    // Get recent transactions for this bank
    const recentTransactions = await Transaction.find({ bank: bank._id })
      .populate('statement', 'month year')
      .sort({ transactionDate: -1 })
      .limit(10);

    // Get transaction statistics
    const transactionStats = await Transaction.aggregate([
      { $match: { bank: bank._id } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get verification statistics
    const verificationStats = await Transaction.aggregate([
      { $match: { bank: bank._id } },
      {
        $group: {
          _id: '$verification.isVerified',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        bank,
        recentTransactions,
        transactionStats,
        verificationStats
      }
    });
  } catch (error) {
    console.error('Error fetching bank:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bank'
    });
  }
});

// @route   POST /api/banks
// @desc    Create new bank
// @access  Private
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      cardholder,
      bankName,
      cardNumber,
      cardType,
      cardLimit,
      availableLimit,
      outstandingAmount = 0
    } = req.body;

    // Validate required fields
    if (!cardholder || !bankName || !cardNumber || !cardType || !cardLimit) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if cardholder exists
    const cardholderExists = await Cardholder.findById(cardholder);
    if (!cardholderExists) {
      return res.status(404).json({
        success: false,
        message: 'Cardholder not found'
      });
    }

    // Check if bank already exists for this cardholder
    const existingBank = await Bank.findOne({
      cardholder,
      cardNumber
    });

    if (existingBank) {
      return res.status(400).json({
        success: false,
        message: 'Bank with this card number already exists for this cardholder'
      });
    }

    const bank = new Bank({
      cardholder,
      bankName,
      cardNumber,
      cardType,
      cardLimit,
      availableLimit: availableLimit || (cardLimit - outstandingAmount),
      outstandingAmount
    });

    await bank.save();
    await bank.populate('cardholder', 'name email phone');

    res.status(201).json({
      success: true,
      data: bank,
      message: 'Bank created successfully'
    });
  } catch (error) {
    console.error('Error creating bank:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating bank'
    });
  }
});

// @route   PUT /api/banks/:id
// @desc    Update bank
// @access  Private
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const {
      bankName,
      cardType,
      cardLimit,
      availableLimit,
      outstandingAmount,
      status
    } = req.body;

    const bank = await Bank.findById(req.params.id);
    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Bank not found'
      });
    }

    // Update fields
    if (bankName) bank.bankName = bankName;
    if (cardType) bank.cardType = cardType;
    if (cardLimit !== undefined) bank.cardLimit = cardLimit;
    if (availableLimit !== undefined) bank.availableLimit = availableLimit;
    if (outstandingAmount !== undefined) bank.outstandingAmount = outstandingAmount;
    if (status) bank.status = status;

    // Recalculate available limit if needed
    if (cardLimit !== undefined || outstandingAmount !== undefined) {
      bank.availableLimit = bank.cardLimit - bank.outstandingAmount;
    }

    bank.lastUpdated = new Date();
    await bank.save();
    await bank.populate('cardholder', 'name email phone');

    res.json({
      success: true,
      data: bank,
      message: 'Bank updated successfully'
    });
  } catch (error) {
    console.error('Error updating bank:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating bank'
    });
  }
});

// @route   DELETE /api/banks/:id
// @desc    Delete bank
// @access  Private
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const bank = await Bank.findById(req.params.id);
    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Bank not found'
      });
    }

    // Check if bank has transactions
    const transactionCount = await Transaction.countDocuments({ bank: bank._id });
    if (transactionCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete bank with existing transactions'
      });
    }

    await Bank.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Bank deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bank:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting bank'
    });
  }
});

// @route   GET /api/banks/:id/transactions
// @desc    Get transactions for a specific bank
// @access  Private
router.get('/:id/transactions', verifyToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      status,
      verified,
      classified,
      startDate,
      endDate,
      sortBy = 'transactionDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = { bank: req.params.id };
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (verified !== undefined) filter['verification.isVerified'] = verified === 'true';
    if (classified !== undefined) filter['classification.isClassified'] = classified === 'true';
    
    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) filter.transactionDate.$gte = new Date(startDate);
      if (endDate) filter.transactionDate.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const transactions = await Transaction.find(filter)
      .populate('statement', 'month year')
      .populate('verification.verifiedBy', 'name email')
      .populate('classification.classifiedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bank transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions'
    });
  }
});

// @route   PUT /api/banks/:id/update-summary
// @desc    Update bank transaction summary
// @access  Private
router.put('/:id/update-summary', verifyToken, async (req, res) => {
  try {
    const bank = await Bank.findById(req.params.id);
    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Bank not found'
      });
    }

    // Recalculate transaction summary from actual transactions
    const summary = await Transaction.aggregate([
      { $match: { bank: bank._id } },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Reset summary
    bank.transactionsSummary = {
      orders: 0,
      bills: 0,
      withdrawals: 0,
      fees: 0,
      personal: 0
    };

    // Update summary with actual data
    summary.forEach(item => {
      if (bank.transactionsSummary[item._id] !== undefined) {
        bank.transactionsSummary[item._id] = item.totalAmount;
      }
    });

    // Recalculate overall summary
    await bank.calculateSummary();

    res.json({
      success: true,
      data: bank,
      message: 'Bank summary updated successfully'
    });
  } catch (error) {
    console.error('Error updating bank summary:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating summary'
    });
  }
});

module.exports = router;
