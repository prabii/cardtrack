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
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

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
      .limit(limitNum);

    const total = await Cardholder.countDocuments(query);

    // Calculate outstanding amounts from banks for each cardholder
    const cardholdersWithOutstanding = await Promise.all(
      cardholders.map(async (cardholder) => {
        // Get all banks for this cardholder
        // Note: Bank model doesn't have isDeleted field, so we don't filter by it
        const banks = await Bank.find({ 
          cardholder: cardholder._id
        });
        
        // Calculate total outstanding from all banks
        // Also check statements if bank outstanding is 0 or not set
        let totalOutstanding = 0;
        
        for (const bank of banks) {
          let bankOutstanding = bank.outstandingAmount || 0;
          
          // If bank outstanding is 0 or not set, try to get from latest statement (any status)
          if (!bankOutstanding || bankOutstanding === 0) {
            // First try to find statement matching this specific bank (by bankName and cardDigits)
            let bankStatement = await Statement.findOne({
              cardholder: cardholder._id,
              bankName: bank.bankName,
              $or: [
                { cardDigits: bank.cardNumber && bank.cardNumber.slice(-4) ? bank.cardNumber.slice(-4) : '' },
                { cardNumber: bank.cardNumber }
              ],
              isDeleted: false,
              'extractedData.outstandingAmount': { $exists: true, $ne: null, $gt: 0 }
            }).sort({ createdAt: -1 });
            
            // If no bank-specific statement found with outstandingAmount > 0, try any statement for this cardholder
            if (!bankStatement || !bankStatement.extractedData?.outstandingAmount || bankStatement.extractedData.outstandingAmount === 0) {
              bankStatement = await Statement.findOne({
                cardholder: cardholder._id,
                isDeleted: false,
                'extractedData.outstandingAmount': { $exists: true, $ne: null, $gt: 0 }
              }).sort({ createdAt: -1 });
            }
            
            // If still no statement with outstandingAmount > 0, try without the $gt: 0 filter
            if (!bankStatement || !bankStatement.extractedData?.outstandingAmount) {
              bankStatement = await Statement.findOne({
                cardholder: cardholder._id,
                bankName: bank.bankName,
                isDeleted: false,
                'extractedData.outstandingAmount': { $exists: true, $ne: null }
              }).sort({ createdAt: -1 });
            }
            
            if (bankStatement && bankStatement.extractedData && bankStatement.extractedData.outstandingAmount !== undefined && bankStatement.extractedData.outstandingAmount !== null) {
              bankOutstanding = bankStatement.extractedData.outstandingAmount;
              console.log(`✅ Using outstanding from statement for ${bank.bankName}: ${bankOutstanding} (Statement ID: ${bankStatement._id}, Status: ${bankStatement.status}, Bank: ${bankStatement.bankName})`);
            } else {
              console.log(`⚠️ No statement found with outstandingAmount for ${bank.bankName} (Card: ${bank.cardNumber ? bank.cardNumber.slice(-4) : 'N/A'})`);
              // List all statements for debugging
              const allStatements = await Statement.find({
                cardholder: cardholder._id,
                isDeleted: false
              }).select('_id bankName cardDigits status extractedData.outstandingAmount').sort({ createdAt: -1 }).limit(5);
              console.log(`   Available statements:`, allStatements.map(s => ({
                id: s._id,
                bankName: s.bankName,
                cardDigits: s.cardDigits,
                status: s.status,
                outstandingAmount: s.extractedData?.outstandingAmount
              })));
            }
          } else {
            console.log(`✅ Using bank outstandingAmount for ${bank.bankName}: ${bankOutstanding}`);
          }
          
          console.log(`Bank ${bank.bankName} (${bank.cardNumber || 'N/A'}): final outstandingAmount = ${bankOutstanding}`);
          totalOutstanding += bankOutstanding;
        }
        
        console.log(`Cardholder ${cardholder.name} (${cardholder._id}): Total outstanding = ${totalOutstanding}, Banks count = ${banks.length}`);
        
        // Debug: Log all banks and their outstanding amounts
        console.log(`All banks for ${cardholder.name}:`, banks.map(b => ({
          bankName: b.bankName,
          outstandingAmount: b.outstandingAmount,
          currency: b.currency
        })));
        
        // Get card count
        const cardCount = banks.length;
        
        // Get last statement date and currency
        const lastStatement = await Statement.findOne({
          cardholder: cardholder._id,
          isDeleted: false
        }).sort({ createdAt: -1 });
        
        // Detect currency from last statement or banks' statements
        let currency = 'USD';
        if (lastStatement && lastStatement.extractedData && lastStatement.extractedData.currency) {
          currency = lastStatement.extractedData.currency;
        } else {
          // Try to find currency from any statement for this cardholder
          const anyStatement = await Statement.findOne({
            cardholder: cardholder._id,
            isDeleted: false,
            'extractedData.currency': { $exists: true, $ne: null }
          });
          if (anyStatement && anyStatement.extractedData && anyStatement.extractedData.currency) {
            currency = anyStatement.extractedData.currency;
          }
        }
        
        // Convert to plain object and add calculated fields
        const cardholderObj = cardholder.toObject();
        cardholderObj.totalOutstanding = totalOutstanding;
        cardholderObj.outstandingAmount = totalOutstanding; // For compatibility
        cardholderObj.cardCount = cardCount;
        cardholderObj.lastStatementDate = lastStatement ? lastStatement.createdAt : null;
        cardholderObj.currency = currency; // Add currency for frontend display
        
        return cardholderObj;
      })
    );

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

    // Calculate total outstanding across all cardholders
    const totalOutstanding = cardholdersWithOutstanding.reduce((sum, c) => {
      return sum + (c.totalOutstanding || 0);
    }, 0);
    
    // Detect currency for total outstanding - prefer INR if any cardholder has INR
    const currencies = cardholdersWithOutstanding
      .map(c => c.currency || 'USD')
      .filter((c, i, arr) => arr.indexOf(c) === i); // unique currencies
    const totalCurrency = currencies.includes('INR') ? 'INR' : (currencies[0] || 'USD');

    res.json({
      success: true,
      data: cardholdersWithOutstanding,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      },
      stats: {
        byStatus: stats,
        totalOutstanding: totalOutstanding
      }
    });
  } catch (error) {
    console.error('Get cardholders error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   GET /api/cardholders/:id
// @desc    Get single cardholder by ID with dashboard data
router.get('/:id', async (req, res) => {
  try {
    const cardholder = await Cardholder.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email');

    if (!cardholder || cardholder.isDeleted) {
      return res.status(404).json({ success: false, message: 'Cardholder not found' });
    }

    // Get related data for dashboard
    const [statements, banks, recentTransactions, allTransactions] = await Promise.all([
      Statement.find({ cardholder: req.params.id, isDeleted: false })
        .sort({ createdAt: -1 })
        .populate('uploadedBy', 'name email'),
      Bank.find({ cardholder: req.params.id }),
      Transaction.find({ cardholder: req.params.id, isDeleted: false })
        .sort({ date: -1 })
        .limit(10)
        .populate('verifiedBy', 'name email')
        .populate('statement', 'month year'),
      Transaction.find({ cardholder: req.params.id, isDeleted: false })
    ]);

    // Get all statements with populated data to link transactions to banks
    const allStatements = await Statement.find({ cardholder: req.params.id, isDeleted: false });
    
    // Create a map of statement ID to bank (using cardDigits and bankName from statement)
    const statementToBankMap = new Map();
    statements.forEach(statement => {
      // Find matching bank by cardDigits (last 4 digits) and bankName
      const matchingBank = banks.find(bank => 
        bank.cardNumber && bank.cardNumber.slice(-4) === statement.cardDigits &&
        bank.bankName === statement.bankName
      );
      if (matchingBank) {
        statementToBankMap.set(statement._id.toString(), matchingBank);
      }
    });

    // Calculate bank summaries per bank
    const bankSummaries = await Promise.all(
      banks.map(async (bank) => {
        // Find transactions for this bank by matching statement's bankName and cardDigits
        const bankStatements = allStatements.filter(s => 
          s.bankName === bank.bankName && 
          s.cardDigits === bank.cardNumber.slice(-4)
        );
        const bankStatementIds = bankStatements.map(s => s._id.toString());
        
        const bankTransactions = allTransactions.filter(t => 
          t.statement && bankStatementIds.includes(t.statement.toString())
        );
        
        const totals = {
          orders: bankTransactions.filter(t => t.category === 'orders').reduce((sum, t) => sum + Math.abs(t.amount), 0),
          bills: bankTransactions.filter(t => t.category === 'bills').reduce((sum, t) => sum + Math.abs(t.amount), 0),
          withdrawals: bankTransactions.filter(t => t.category === 'withdrawals').reduce((sum, t) => sum + Math.abs(t.amount), 0),
          fees: bankTransactions.filter(t => t.category === 'fees').reduce((sum, t) => sum + Math.abs(t.amount), 0),
          personal: bankTransactions.filter(t => t.category === 'personal_use').reduce((sum, t) => sum + Math.abs(t.amount), 0)
        };
        
        // Calculate total payouts received (for orders with payoutReceived = true)
        const totalPayoutsReceived = bankTransactions
          .filter(t => t.category === 'orders' && t.payoutReceived === true)
          .reduce((sum, t) => sum + (t.payoutAmount || 0), 0);
        
        // Detect currency - prioritize bank.currency, then statement currency, default to INR
        let bankCurrency = bank.currency || 'INR';
        if (!bankCurrency || bankCurrency === 'USD') {
          // Only check statements if bank doesn't have currency set
          if (bankStatements.length > 0) {
            const latestBankStatement = bankStatements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
            if (latestBankStatement && latestBankStatement.extractedData && latestBankStatement.extractedData.currency) {
              bankCurrency = latestBankStatement.extractedData.currency;
            }
          }
        }
        
        // Calculate outstanding from transactions (sum of all transaction amounts)
        // Transactions are typically negative (debits), so we sum absolute values
        const calculatedOutstanding = bankTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        // Get last transaction for this bank
        const lastTransaction = bankTransactions.length > 0 
          ? bankTransactions.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))[0]
          : null;
        
        const summary = {
          bankId: bank._id,
          bankName: bank.bankName,
          cardNumber: bank.cardNumber,
          cardLimit: bank.cardLimit,
          availableLimit: bank.availableLimit,
          outstandingAmount: bank.outstandingAmount, // Manual outstanding from bank
          calculatedOutstanding: calculatedOutstanding, // Calculated from transactions
          lastTransaction: lastTransaction ? {
            date: lastTransaction.date || lastTransaction.createdAt,
            amount: lastTransaction.amount,
            description: lastTransaction.description,
            category: lastTransaction.category
          } : null,
          currency: bankCurrency,
          totals,
          totalPayoutsReceived,
          profit: totals.orders - totals.bills - totals.fees, // Simplified calculation
          loss: totals.bills + totals.fees + totals.personal, // Simplified calculation
          toTake: bank.outstandingAmount,
          toGive: bank.availableLimit
        };
        
        return summary;
      })
    );

    // Calculate overall summary across all banks
    const totalPayoutsReceived = allTransactions
      .filter(t => t.category === 'orders' && t.payoutReceived === true)
      .reduce((sum, t) => sum + (t.payoutAmount || 0), 0);
    
    const overallSummary = {
      totalToGive: banks.reduce((sum, bank) => sum + bank.availableLimit, 0),
      totalToTake: banks.reduce((sum, bank) => sum + bank.outstandingAmount, 0),
      totalOrders: allTransactions.filter(t => t.category === 'orders').reduce((sum, t) => sum + Math.abs(t.amount), 0),
      totalBills: allTransactions.filter(t => t.category === 'bills').reduce((sum, t) => sum + Math.abs(t.amount), 0),
      totalWithdrawals: allTransactions.filter(t => t.category === 'withdrawals').reduce((sum, t) => sum + Math.abs(t.amount), 0),
      totalFees: allTransactions.filter(t => t.category === 'fees').reduce((sum, t) => sum + Math.abs(t.amount), 0),
      totalPersonal: allTransactions.filter(t => t.category === 'personal_use').reduce((sum, t) => sum + Math.abs(t.amount), 0),
      totalPayoutsReceived,
      advancesToCardholder: 0, // To be calculated based on business logic
      totalAmountGiven: 0 // To be calculated based on business logic
    };

    // Detect currency from cardholder's statements
    let currency = 'USD';
    const latestStatement = statements[0];
    if (latestStatement && latestStatement.extractedData && latestStatement.extractedData.currency) {
      currency = latestStatement.extractedData.currency;
    } else {
      // Try to find currency from any statement
      const anyStatement = await Statement.findOne({
        cardholder: req.params.id,
        isDeleted: false,
        'extractedData.currency': { $exists: true, $ne: null }
      });
      if (anyStatement && anyStatement.extractedData && anyStatement.extractedData.currency) {
        currency = anyStatement.extractedData.currency;
      }
    }

    res.json({
      success: true,
      data: {
        // Cardholder Details (Mandatory fields)
        cardholder: {
          ...cardholder.getPublicProfile(),
          currency: currency, // Add currency to cardholder
          // Ensure all mandatory fields are present
          dob: cardholder.dob,
          fatherName: cardholder.fatherName,
          motherName: cardholder.motherName,
          address: cardholder.address,
          phone: cardholder.phone,
          email: cardholder.email
        },
        // Statements
        statements: statements.map(s => ({
          id: s._id,
          month: s.month,
          year: s.year,
          fullMonth: s.fullMonth,
          timePeriod: s.timePeriod,
          cardDigits: s.cardDigits,
          status: s.status,
          deadline: s.deadline,
          isOverdue: s.isOverdue,
          uploadedBy: s.uploadedBy
        })),
        // Individual Bank Data (All transactions)
        transactions: allTransactions.map(t => ({
          id: t._id,
          date: t.date,
          description: t.description,
          amount: t.amount,
          category: t.category,
          orderSubcategory: t.orderSubcategory,
          payoutReceived: t.payoutReceived,
          payoutAmount: t.payoutAmount,
          verified: t.verified,
          verifiedBy: t.verifiedBy,
          verifiedAt: t.verifiedAt,
          notes: t.notes
        })),
        // Bank Summary (Per Bank)
        bankSummaries,
        // Overall Summary (All Banks)
        overallSummary,
        // Recent transactions for quick view
        recentTransactions: recentTransactions.slice(0, 10)
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
// @desc    Update cardholder status (Admin, Manager, Operator only)
router.put('/:id/status', requirePermission('edit_cardholders'), [
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
