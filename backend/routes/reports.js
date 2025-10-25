const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Cardholder = require('../models/Cardholder');
const Statement = require('../models/Statement');
const Transaction = require('../models/Transaction');
const Bank = require('../models/Bank');
const BillPayment = require('../models/BillPayment');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const { requirePermission, requireModuleAccess } = require('../middleware/roles');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Apply module access middleware
router.use(requireModuleAccess('reports'));

// @route   GET /api/reports/dashboard
// @desc    Get dashboard summary statistics
router.get('/dashboard', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get basic counts
    const [
      totalCardholders,
      totalStatements,
      totalTransactions,
      totalBillPayments,
      totalBanks,
      activeUsers
    ] = await Promise.all([
      Cardholder.countDocuments({ isDeleted: false }),
      Statement.countDocuments(dateFilter),
      Transaction.countDocuments(dateFilter),
      BillPayment.countDocuments(dateFilter),
      Bank.countDocuments(dateFilter),
      User.countDocuments({ isActive: true })
    ]);

    // Get financial summaries
    const financialSummary = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    // Get category breakdown
    const categoryBreakdown = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Get monthly trends
    const monthlyTrends = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get top cardholders by transaction count
    const topCardholders = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$cardholder',
          transactionCount: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { transactionCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'cardholders',
          localField: '_id',
          foreignField: '_id',
          as: 'cardholder'
        }
      },
      { $unwind: '$cardholder' },
      {
        $project: {
          cardholderName: '$cardholder.name',
          cardholderEmail: '$cardholder.email',
          transactionCount: 1,
          totalAmount: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalCardholders,
          totalStatements,
          totalTransactions,
          totalBillPayments,
          totalBanks,
          activeUsers
        },
        financial: financialSummary[0] || {
          totalAmount: 0,
          averageAmount: 0,
          totalTransactions: 0
        },
        categoryBreakdown,
        monthlyTrends,
        topCardholders
      }
    });
  } catch (error) {
    console.error('Dashboard reports error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/reports/cardholders
// @desc    Get cardholder reports
router.get('/cardholders', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('status').optional().isIn(['active', 'inactive']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
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
      startDate,
      endDate,
      status,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter
    const filter = { isDeleted: false };
    if (status) {
      filter.isActive = status === 'active';
    }

    // Get cardholders with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const cardholders = await Cardholder.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get statistics for each cardholder
    const cardholdersWithStats = await Promise.all(
      cardholders.map(async (cardholder) => {
        const [statementCount, transactionCount, totalAmount] = await Promise.all([
          Statement.countDocuments({ cardholder: cardholder._id }),
          Transaction.countDocuments({ cardholder: cardholder._id }),
          Transaction.aggregate([
            { $match: { cardholder: cardholder._id } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ])
        ]);

        return {
          ...cardholder.toObject(),
          stats: {
            statementCount,
            transactionCount,
            totalAmount: totalAmount[0]?.total || 0
          }
        };
      })
    );

    // Get total count
    const total = await Cardholder.countDocuments(filter);

    res.json({
      success: true,
      data: cardholdersWithStats,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Cardholder reports error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/reports/transactions
// @desc    Get transaction reports
router.get('/transactions', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('category').optional().isString(),
  query('cardholder').optional().isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
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
      startDate,
      endDate,
      category,
      cardholder,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter
    const filter = {};
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (category) {
      filter.category = category;
    }
    if (cardholder) {
      filter.cardholder = cardholder;
    }

    // Get transactions with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const transactions = await Transaction.find(filter)
      .populate('cardholder', 'name email')
      .populate('bank', 'bankName accountNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get summary statistics
    const summary = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get category breakdown
    const categoryBreakdown = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Get total count
    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      data: {
        transactions,
        summary: summary[0] || {
          totalAmount: 0,
          averageAmount: 0,
          count: 0
        },
        categoryBreakdown,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Transaction reports error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/reports/bill-payments
// @desc    Get bill payment reports
router.get('/bill-payments', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('status').optional().isIn(['pending', 'processing', 'completed', 'failed']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
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
      startDate,
      endDate,
      status,
      priority,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter
    const filter = {};
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (status) {
      filter.status = status;
    }
    if (priority) {
      filter.priority = priority;
    }

    // Get bill payments with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const billPayments = await BillPayment.find(filter)
      .populate('cardholder', 'name email')
      .populate('bank', 'bankName accountNumber')
      .populate('operator', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get summary statistics
    const summary = await BillPayment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get status breakdown
    const statusBreakdown = await BillPayment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get priority breakdown
    const priorityBreakdown = await BillPayment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get total count
    const total = await BillPayment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        billPayments,
        summary: summary[0] || {
          totalAmount: 0,
          averageAmount: 0,
          count: 0
        },
        statusBreakdown,
        priorityBreakdown,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Bill payment reports error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/reports/statements
// @desc    Get statement reports
router.get('/statements', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('cardholder').optional().isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
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
      startDate,
      endDate,
      cardholder,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter
    const filter = {};
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (cardholder) {
      filter.cardholder = cardholder;
    }

    // Get statements with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const statements = await Statement.find(filter)
      .populate('cardholder', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get summary statistics
    const summary = await Statement.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          averageAmount: { $avg: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get monthly breakdown
    const monthlyBreakdown = await Statement.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get total count
    const total = await Statement.countDocuments(filter);

    res.json({
      success: true,
      data: {
        statements,
        summary: summary[0] || {
          totalAmount: 0,
          averageAmount: 0,
          count: 0
        },
        monthlyBreakdown,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Statement reports error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/reports/export/:type
// @desc    Export reports to CSV/PDF
router.get('/export/:type', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('format').optional().isIn(['csv', 'pdf'])
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

    const { type } = req.params;
    const { startDate, endDate, format = 'csv' } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let data = [];
    let filename = '';

    switch (type) {
      case 'cardholders':
        data = await Cardholder.find({ isDeleted: false, ...dateFilter })
          .populate('cardholder', 'name email')
          .sort({ createdAt: -1 });
        filename = 'cardholders_report';
        break;

      case 'transactions':
        data = await Transaction.find(dateFilter)
          .populate('cardholder', 'name email')
          .populate('bank', 'bankName accountNumber')
          .sort({ createdAt: -1 });
        filename = 'transactions_report';
        break;

      case 'bill-payments':
        data = await BillPayment.find(dateFilter)
          .populate('cardholder', 'name email')
          .populate('bank', 'bankName accountNumber')
          .populate('operator', 'name email')
          .sort({ createdAt: -1 });
        filename = 'bill_payments_report';
        break;

      case 'statements':
        data = await Statement.find(dateFilter)
          .populate('cardholder', 'name email')
          .sort({ createdAt: -1 });
        filename = 'statements_report';
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    if (format === 'csv') {
      // Generate CSV
      const csv = generateCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csv);
    } else {
      // For PDF, you would use a library like puppeteer or jsPDF
      res.json({
        success: true,
        message: 'PDF export not implemented yet',
        data: data.slice(0, 10) // Return sample data
      });
    }
  } catch (error) {
    console.error('Export reports error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper function to generate CSV
function generateCSV(data) {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0].toObject ? data[0].toObject() : data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    const obj = row.toObject ? row.toObject() : row;
    return headers.map(header => {
      const value = obj[header];
      if (typeof value === 'object' && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      return `"${String(value || '').replace(/"/g, '""')}"`;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

module.exports = router;
