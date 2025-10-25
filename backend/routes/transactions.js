const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Bank = require('../models/Bank');
const { verifyToken } = require('../middleware/auth');

// @route   GET /api/transactions
// @desc    Get all transactions with filtering and pagination
// @access  Private
router.get('/', verifyToken, async (req, res) => {
  try {
    const {
      cardholder,
      bank,
      statement,
      category,
      status,
      verified,
      classified,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'transactionDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (cardholder) filter.cardholder = cardholder;
    if (bank) filter.bank = bank;
    if (statement) filter.statement = statement;
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

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const transactions = await Transaction.find(filter)
      .populate('bank', 'bankName cardNumber cardType')
      .populate('cardholder', 'name email phone')
      .populate('statement', 'month year')
      .populate('verification.verifiedBy', 'name email')
      .populate('classification.classifiedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(filter);

    // Get statistics
    const stats = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          verifiedCount: {
            $sum: { $cond: ['$verification.isVerified', 1, 0] }
          },
          classifiedCount: {
            $sum: { $cond: ['$classification.isClassified', 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      },
      stats: stats[0] || {
        totalTransactions: 0,
        totalAmount: 0,
        verifiedCount: 0,
        classifiedCount: 0
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions'
    });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get single transaction
// @access  Private
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('bank', 'bankName cardNumber cardType')
      .populate('cardholder', 'name email phone address')
      .populate('statement', 'month year timePeriod')
      .populate('verification.verifiedBy', 'name email')
      .populate('classification.classifiedBy', 'name email');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transaction'
    });
  }
});

// @route   PUT /api/transactions/:id/verify
// @desc    Verify a transaction
// @access  Private
router.put('/:id/verify', verifyToken, async (req, res) => {
  try {
    const { notes = '' } = req.body;

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    await transaction.verifyTransaction(req.user.id, notes);

    // Update bank summary
    const bank = await Bank.findById(transaction.bank);
    if (bank) {
      await bank.addTransaction(transaction.amount, transaction.category);
    }

    await transaction.populate('verification.verifiedBy', 'name email');

    res.json({
      success: true,
      data: transaction,
      message: 'Transaction verified successfully'
    });
  } catch (error) {
    console.error('Error verifying transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying transaction'
    });
  }
});

// @route   PUT /api/transactions/:id/reject
// @desc    Reject a transaction
// @access  Private
router.put('/:id/reject', verifyToken, async (req, res) => {
  try {
    const { notes = '' } = req.body;

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    await transaction.rejectTransaction(req.user.id, notes);
    await transaction.populate('verification.verifiedBy', 'name email');

    res.json({
      success: true,
      data: transaction,
      message: 'Transaction rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting transaction'
    });
  }
});

// @route   PUT /api/transactions/:id/classify
// @desc    Classify a transaction
// @access  Private
router.put('/:id/classify', verifyToken, async (req, res) => {
  try {
    const { category, confidence = 0, notes = '' } = req.body;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required for classification'
      });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    await transaction.classifyTransaction(req.user.id, category, confidence, notes);
    await transaction.populate('classification.classifiedBy', 'name email');

    res.json({
      success: true,
      data: transaction,
      message: 'Transaction classified successfully'
    });
  } catch (error) {
    console.error('Error classifying transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while classifying transaction'
    });
  }
});

// @route   PUT /api/transactions/:id/dispute
// @desc    Dispute a transaction
// @access  Private
router.put('/:id/dispute', verifyToken, async (req, res) => {
  try {
    const { notes = '' } = req.body;

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    await transaction.disputeTransaction(notes);

    res.json({
      success: true,
      data: transaction,
      message: 'Transaction disputed successfully'
    });
  } catch (error) {
    console.error('Error disputing transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while disputing transaction'
    });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update transaction details
// @access  Private
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const {
      description,
      amount,
      category,
      subcategory,
      merchant,
      location,
      tags,
      notes
    } = req.body;

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Update fields
    if (description) transaction.description = description;
    if (amount !== undefined) transaction.amount = amount;
    if (category) transaction.category = category;
    if (subcategory !== undefined) transaction.subcategory = subcategory;
    if (merchant !== undefined) transaction.merchant = merchant;
    if (location !== undefined) transaction.location = location;
    if (tags) transaction.tags = tags;
    if (notes !== undefined) transaction.notes = notes;

    await transaction.save();
    await transaction.populate('bank cardholder statement');

    res.json({
      success: true,
      data: transaction,
      message: 'Transaction updated successfully'
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating transaction'
    });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    await Transaction.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting transaction'
    });
  }
});

// @route   POST /api/transactions/bulk-verify
// @desc    Bulk verify multiple transactions
// @access  Private
router.post('/bulk-verify', verifyToken, async (req, res) => {
  try {
    const { transactionIds, notes = '' } = req.body;

    if (!transactionIds || !Array.isArray(transactionIds)) {
      return res.status(400).json({
        success: false,
        message: 'Transaction IDs array is required'
      });
    }

    const results = [];
    for (const transactionId of transactionIds) {
      try {
        const transaction = await Transaction.findById(transactionId);
        if (transaction) {
          await transaction.verifyTransaction(req.user.id, notes);
          results.push({ id: transactionId, success: true });
        } else {
          results.push({ id: transactionId, success: false, error: 'Transaction not found' });
        }
      } catch (error) {
        results.push({ id: transactionId, success: false, error: error.message });
      }
    }

    res.json({
      success: true,
      data: results,
      message: 'Bulk verification completed'
    });
  } catch (error) {
    console.error('Error in bulk verification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk verification'
    });
  }
});

// @route   POST /api/transactions/bulk-classify
// @desc    Bulk classify multiple transactions
// @access  Private
router.post('/bulk-classify', verifyToken, async (req, res) => {
  try {
    const { transactionIds, category, confidence = 0, notes = '' } = req.body;

    if (!transactionIds || !Array.isArray(transactionIds)) {
      return res.status(400).json({
        success: false,
        message: 'Transaction IDs array is required'
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required for classification'
      });
    }

    const results = [];
    for (const transactionId of transactionIds) {
      try {
        const transaction = await Transaction.findById(transactionId);
        if (transaction) {
          await transaction.classifyTransaction(req.user.id, category, confidence, notes);
          results.push({ id: transactionId, success: true });
        } else {
          results.push({ id: transactionId, success: false, error: 'Transaction not found' });
        }
      } catch (error) {
        results.push({ id: transactionId, success: false, error: error.message });
      }
    }

    res.json({
      success: true,
      data: results,
      message: 'Bulk classification completed'
    });
  } catch (error) {
    console.error('Error in bulk classification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk classification'
    });
  }
});

// @route   GET /api/transactions/stats/verification
// @desc    Get verification statistics
// @access  Private
router.get('/stats/verification', verifyToken, async (req, res) => {
  try {
    const { cardholder, bank, startDate, endDate } = req.query;

    const matchStage = {};
    if (cardholder) matchStage.cardholder = cardholder;
    if (bank) matchStage.bank = bank;
    if (startDate || endDate) {
      matchStage.transactionDate = {};
      if (startDate) matchStage.transactionDate.$gte = new Date(startDate);
      if (endDate) matchStage.transactionDate.$lte = new Date(endDate);
    }

    const stats = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            verified: '$verification.isVerified',
            status: '$status'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: '$_id.verified',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count',
              totalAmount: '$totalAmount'
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching verification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching verification statistics'
    });
  }
});

module.exports = router;
