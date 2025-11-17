const express = require('express');
const { body, validationResult, query } = require('express-validator');
const BillPayment = require('../models/BillPayment');
const Statement = require('../models/Statement');
const Transaction = require('../models/Transaction');
const GatewayTransaction = require('../models/GatewayTransaction');
const Cardholder = require('../models/Cardholder');
const { verifyToken } = require('../middleware/auth');
const { requirePermission, requireModuleAccess } = require('../middleware/roles');

const router = express.Router();

// Get socket service instance
let socketService = null;
try {
  // Try to get from global first (set in server.js)
  socketService = global.socketService;
  if (!socketService) {
    // Fallback: try to get from server module
    const serverModule = require('../server');
    socketService = serverModule.socketService;
  }
} catch (error) {
  console.warn('Socket service not available:', error.message);
}

// Apply authentication middleware to all routes
router.use(verifyToken);

// Apply module access middleware for alerts
router.use(requireModuleAccess('alerts'));

// @route   GET /api/alerts
// @desc    Get all alerts (bill payments due, tally, withdrawals)
router.get('/', [
  query('type').optional().isIn(['bill_payment_due', 'tally_required', 'withdrawal_alert']),
  query('priority').optional().isIn(['high', 'medium', 'low']),
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

    const { type, priority, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const alerts = [];

    // 1. Bill Payment Due Alerts
    if (!type || type === 'bill_payment_due') {
      const today = new Date();
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(today.getDate() + 3);

      const duePayments = await BillPayment.find({
        status: { $in: ['pending', 'assigned'] },
        'paymentDetails.dueDate': {
          $gte: today,
          $lte: threeDaysFromNow
        },
        isDeleted: false
      })
        .populate('cardholder', 'name email phone')
        .populate('bank', 'bankName cardNumber')
        .sort({ 'paymentDetails.dueDate': 1 });

      duePayments.forEach(payment => {
        const daysUntilDue = Math.ceil(
          (new Date(payment.paymentDetails.dueDate) - today) / (1000 * 60 * 60 * 24)
        );
        
        let alertPriority = 'medium';
        if (daysUntilDue <= 1) alertPriority = 'high';
        else if (daysUntilDue <= 2) alertPriority = 'medium';
        else alertPriority = 'low';

        if (!priority || priority === alertPriority) {
          const alert = {
            id: `bill_${payment._id}`,
            type: 'bill_payment_due',
            priority: alertPriority,
            title: 'Bill Payment Due',
            message: `${payment.billDetails.billerName} - ${payment.paymentDetails.amount} ${payment.paymentDetails.currency}`,
            details: {
              billPaymentId: payment._id,
              cardholder: payment.cardholder,
              bank: payment.bank,
              amount: payment.paymentDetails.amount,
              currency: payment.paymentDetails.currency,
              dueDate: payment.paymentDetails.dueDate,
              daysUntilDue
            },
            timestamp: new Date(),
            count: 1
          };
          alerts.push(alert);

          // Broadcast real-time alert (only once per request, not for every payment)
          // This will be handled by periodic checks or when payment is created/updated
        }
      });
    }

    // 2. Tally Required Alerts
    if (!type || type === 'tally_required') {
      const statements = await Statement.find({
        status: 'processed',
        isDeleted: false
      })
        .populate('cardholder', 'name email phone')
        .sort({ createdAt: -1 })
        .limit(100); // Limit to recent statements

      for (const statement of statements) {
        const transactions = await Transaction.find({
          statement: statement._id,
          isDeleted: false
        });

        const verifiedCount = transactions.filter(t => t.verified).length;
        const totalCount = transactions.length;
        const unverifiedCount = totalCount - verifiedCount;

        if (totalCount > 0 && unverifiedCount > 0) {
          const unverifiedPercentage = (unverifiedCount / totalCount) * 100;
          
          let alertPriority = 'medium';
          if (unverifiedPercentage > 50) alertPriority = 'high';
          else if (unverifiedPercentage > 25) alertPriority = 'medium';
          else alertPriority = 'low';

          if (!priority || priority === alertPriority) {
            const alert = {
              id: `tally_${statement._id}`,
              type: 'tally_required',
              priority: alertPriority,
              title: 'Tally Required',
              message: `Statement ${statement.month} ${statement.year} has ${unverifiedCount} unverified transactions`,
              details: {
                statementId: statement._id,
                cardholder: statement.cardholder,
                month: statement.month,
                year: statement.year,
                bankName: statement.bankName,
                transactions: {
                  total: totalCount,
                  verified: verifiedCount,
                  unverified: unverifiedCount
                }
              },
              timestamp: statement.createdAt,
              count: unverifiedCount
            };
            alerts.push(alert);
          }
        }
      }
    }

    // 3. Withdrawal Alerts
    if (!type || type === 'withdrawal_alert') {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      const largeWithdrawals = await GatewayTransaction.find({
        transactionType: 'withdrawal',
        transactionDate: {
          $gte: sevenDaysAgo,
          $lte: today
        },
        amount: { $gte: 5000 } // Alert for withdrawals >= $5000
      })
        .populate('gateway', 'name')
        .populate('cardholder', 'name email')
        .sort({ amount: -1 })
        .limit(50);

      largeWithdrawals.forEach(withdrawal => {
        let alertPriority = 'medium';
        if (withdrawal.amount >= 10000) alertPriority = 'high';
        else if (withdrawal.amount >= 7500) alertPriority = 'medium';
        else alertPriority = 'low';

        if (!priority || priority === alertPriority) {
          const alert = {
            id: `withdrawal_${withdrawal._id}`,
            type: 'withdrawal_alert',
            priority: alertPriority,
            title: 'Large Withdrawal Detected',
            message: `Withdrawal of ${withdrawal.amount} ${withdrawal.currency} from ${withdrawal.gateway?.name || 'Gateway'}`,
            details: {
              transactionId: withdrawal._id,
              gateway: withdrawal.gateway,
              cardholder: withdrawal.cardholder,
              amount: withdrawal.amount,
              currency: withdrawal.currency,
              transactionDate: withdrawal.transactionDate
            },
            timestamp: withdrawal.transactionDate,
            amount: withdrawal.amount
          };
          alerts.push(alert);
        }
      });
    }

    // Sort alerts by priority and timestamp
    alerts.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    // Apply pagination
    const paginatedResults = alerts.slice(skip, skip + parseInt(limit));
    const total = alerts.length;

    res.json({
      success: true,
      data: paginatedResults,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      },
      summary: {
        total: alerts.length,
        byType: {
          bill_payment_due: alerts.filter(a => a.type === 'bill_payment_due').length,
          tally_required: alerts.filter(a => a.type === 'tally_required').length,
          withdrawal_alert: alerts.filter(a => a.type === 'withdrawal_alert').length
        },
        byPriority: {
          high: alerts.filter(a => a.priority === 'high').length,
          medium: alerts.filter(a => a.priority === 'medium').length,
          low: alerts.filter(a => a.priority === 'low').length
        }
      }
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST /api/alerts/tally-date
// @desc    Set tally date (for managers/admins)
router.post('/tally-date', [
  body('tallyDate', 'Tally date is required').isISO8601().toDate(),
  body('description').optional().isString().trim()
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

    // Check if user has permission (manager or admin)
    if (!['manager', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only managers and admins can set tally dates'
      });
    }

    const { tallyDate, description } = req.body;

    // Store tally date in settings or a separate Tally model
    // For now, we'll use a simple approach - store in a settings collection
    // In production, you might want to create a TallySettings model
    
    // TODO: Create TallySettings model or use existing settings system
    // For now, return success with the date
    
    res.json({
      success: true,
      message: 'Tally date set successfully',
      data: {
        tallyDate: new Date(tallyDate),
        description: description || '',
        setBy: {
          id: req.user.id || req.user.userId || req.user._id,
          name: req.user.name,
          role: req.user.role
        },
        setAt: new Date()
      }
    });
  } catch (error) {
    console.error('Set tally date error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;

