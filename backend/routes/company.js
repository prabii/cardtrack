const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Company = require('../models/Company');
const CompanyProfit = require('../models/CompanyProfit');
const FDCard = require('../models/FDCard');
const Expense = require('../models/Expense');
const Project = require('../models/Project');
const { verifyToken } = require('../middleware/auth');
const { requirePermission, requireModuleAccess } = require('../middleware/roles');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Apply module access middleware
router.use(requireModuleAccess('company'));

// @route   GET /api/company/dashboard
// @desc    Get company dashboard summary
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
      totalCompanies,
      totalProjects,
      totalFDCards,
      totalExpenses,
      activeProjects
    ] = await Promise.all([
      Company.countDocuments({ isActive: true }),
      Project.countDocuments(dateFilter),
      FDCard.countDocuments({ status: 'active' }),
      Expense.countDocuments(dateFilter),
      Project.countDocuments({ status: 'active' })
    ]);

    // Get financial summaries
    const expenseSummary = await Expense.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const fdCardSummary = await FDCard.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$currentValue' },
          totalPrincipal: { $sum: '$principalAmount' },
          totalInterest: { $sum: '$interestEarned' },
          count: { $sum: 1 }
        }
      }
    ]);

    const projectSummary = await Project.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalBudget: { $sum: '$budget' },
          totalActualCost: { $sum: '$actualCost' },
          averageProgress: { $avg: '$progress' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent activities
    const recentProjects = await Project.find(dateFilter)
      .populate('company', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentExpenses = await Expense.find(dateFilter)
      .populate('company', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        summary: {
          totalCompanies,
          totalProjects,
          totalFDCards,
          totalExpenses,
          activeProjects
        },
        expenses: expenseSummary[0] || {
          totalAmount: 0,
          averageAmount: 0,
          count: 0
        },
        fdCards: fdCardSummary[0] || {
          totalValue: 0,
          totalPrincipal: 0,
          totalInterest: 0,
          count: 0
        },
        projects: projectSummary[0] || {
          totalBudget: 0,
          totalActualCost: 0,
          averageProgress: 0,
          count: 0
        },
        recentActivities: {
          projects: recentProjects,
          expenses: recentExpenses
        }
      }
    });
  } catch (error) {
    console.error('Company dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/company/companies
// @desc    Get all companies
router.get('/companies', async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive, search } = req.query;
    
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const companies = await Company.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Company.countDocuments(filter);

    res.json({
      success: true,
      data: {
        companies,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/company/companies
// @desc    Create new company
router.post('/companies', requirePermission('manage_company'), [
  body('name')
    .notEmpty().withMessage('Company name is required')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Company name must be between 1 and 100 characters'),
  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('industry')
    .optional({ checkFalsy: true })
    .trim(),
  body('website')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (!value || value === '') return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }).withMessage('Please enter a valid URL'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim(),
  body('address.street')
    .optional({ checkFalsy: true })
    .trim(),
  body('address.city')
    .optional({ checkFalsy: true })
    .trim(),
  body('address.state')
    .optional({ checkFalsy: true })
    .trim(),
  body('address.zipCode')
    .optional({ checkFalsy: true })
    .trim(),
  body('address.country')
    .optional({ checkFalsy: true })
    .trim(),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean')
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
      description,
      industry,
      website,
      email,
      phone,
      address,
      isActive = true
    } = req.body;

    // Check if company with same name already exists
    const existingCompany = await Company.findOne({ name: name.trim() });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company with this name already exists'
      });
    }

    const company = new Company({
      name: name.trim(),
      description: description?.trim() || '',
      industry: industry?.trim() || '',
      website: website?.trim() || '',
      email: email?.toLowerCase().trim() || '',
      phone: phone?.trim() || '',
      address: address || {},
      isActive,
      createdBy: req.user.id
    });

    await company.save();

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: company
    });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/company/companies/:id
// @desc    Update company
router.put('/companies/:id', requirePermission('manage_company'), [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('website').optional().isURL(),
  body('email').optional().isEmail().normalizeEmail(),
  body('isActive').optional().isBoolean()
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

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const {
      name,
      description,
      industry,
      website,
      email,
      phone,
      address,
      isActive
    } = req.body;

    if (name) company.name = name.trim();
    if (description !== undefined) company.description = description.trim();
    if (industry !== undefined) company.industry = industry.trim();
    if (website !== undefined) company.website = website.trim();
    if (email !== undefined) company.email = email.toLowerCase().trim();
    if (phone !== undefined) company.phone = phone.trim();
    if (address) company.address = { ...company.address, ...address };
    if (isActive !== undefined) company.isActive = isActive;

    await company.save();

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: company
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/company/companies/:id
// @desc    Delete company
router.delete('/companies/:id', requirePermission('manage_company'), async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if company has associated data
    const [projectsCount, expensesCount, fdCardsCount] = await Promise.all([
      Project.countDocuments({ company: company._id }),
      Expense.countDocuments({ company: company._id }),
      FDCard.countDocuments({ company: company._id })
    ]);

    if (projectsCount > 0 || expensesCount > 0 || fdCardsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete company. It has ${projectsCount} projects, ${expensesCount} expenses, and ${fdCardsCount} FD cards associated with it.`
      });
    }

    await Company.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/company/profits
// @desc    Get company profits
router.get('/profits', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('period').optional().isIn(['monthly', 'quarterly', 'yearly']),
  query('year').optional().isInt({ min: 2020, max: 2030 }),
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
      period,
      year,
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
    if (period) {
      filter.period = period;
    }
    if (year) {
      filter.year = parseInt(year);
    }

    // Get profits with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const profits = await CompanyProfit.find(filter)
      .populate('company', 'name')
      .populate('createdBy', 'name')
      .sort({ year: -1, month: -1, quarter: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get summary statistics
    const summary = await CompanyProfit.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$revenue' },
          totalExpenses: { $sum: '$expenses' },
          totalNetProfit: { $sum: '$netProfit' },
          averageProfitMargin: { $avg: '$profitMargin' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total count
    const total = await CompanyProfit.countDocuments(filter);

    res.json({
      success: true,
      data: {
        profits,
        summary: summary[0] || {
          totalRevenue: 0,
          totalExpenses: 0,
          totalNetProfit: 0,
          averageProfitMargin: 0,
          count: 0
        },
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Company profits error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/company/profits
// @desc    Create company profit record
router.post('/profits', requirePermission('manage_company'), [
  body('company').isMongoId().withMessage('Valid company ID is required'),
  body('period').isIn(['monthly', 'quarterly', 'yearly']).withMessage('Valid period is required'),
  body('year').isInt({ min: 2020, max: 2030 }).withMessage('Valid year is required'),
  body('revenue').isNumeric().withMessage('Revenue must be a number'),
  body('expenses').isNumeric().withMessage('Expenses must be a number'),
  body('description').optional().isString().trim().isLength({ max: 500 })
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

    const { company, period, year, month, quarter, revenue, expenses, description } = req.body;

    // Validate period-specific fields
    if (period === 'monthly' && !month) {
      return res.status(400).json({
        success: false,
        message: 'Month is required for monthly period'
      });
    }
    if (period === 'quarterly' && !quarter) {
      return res.status(400).json({
        success: false,
        message: 'Quarter is required for quarterly period'
      });
    }

    // Check if profit record already exists
    const existingProfit = await CompanyProfit.findOne({
      company,
      period,
      year,
      ...(period === 'monthly' && { month }),
      ...(period === 'quarterly' && { quarter })
    });

    if (existingProfit) {
      return res.status(400).json({
        success: false,
        message: 'Profit record already exists for this period'
      });
    }

    const profit = new CompanyProfit({
      company,
      period,
      year,
      month,
      quarter,
      revenue,
      expenses,
      description,
      createdBy: req.user.id
    });

    await profit.save();
    await profit.populate('company', 'name');
    await profit.populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Profit record created successfully',
      data: profit
    });
  } catch (error) {
    console.error('Create company profit error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/company/fd-cards
// @desc    Get FD cards
router.get('/fd-cards', [
  query('status').optional().isIn(['active', 'matured', 'closed', 'suspended']),
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

    const { status, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = {};
    if (status) {
      filter.status = status;
    }

    // Get FD cards with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const fdCards = await FDCard.find(filter)
      .populate('company', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get summary statistics
    const summary = await FDCard.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$currentValue' },
          totalPrincipal: { $sum: '$principalAmount' },
          totalInterest: { $sum: '$interestEarned' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total count
    const total = await FDCard.countDocuments(filter);

    res.json({
      success: true,
      data: {
        fdCards,
        summary: summary[0] || {
          totalValue: 0,
          totalPrincipal: 0,
          totalInterest: 0,
          count: 0
        },
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('FD cards error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/company/fd-cards
// @desc    Create FD card
router.post('/fd-cards', requirePermission('manage_company'), [
  body('company').isMongoId().withMessage('Valid company ID is required'),
  body('cardNumber').notEmpty().withMessage('Card number is required'),
  body('bankName').notEmpty().withMessage('Bank name is required'),
  body('accountHolder').notEmpty().withMessage('Account holder name is required'),
  body('principalAmount').isNumeric().withMessage('Principal amount must be a number'),
  body('interestRate').isNumeric().withMessage('Interest rate must be a number'),
  body('maturityDate').isISO8601().withMessage('Valid maturity date is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required')
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

    const fdCard = new FDCard({
      ...req.body,
      createdBy: req.user.id
    });

    await fdCard.save();
    await fdCard.populate('company', 'name');
    await fdCard.populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'FD card created successfully',
      data: fdCard
    });
  } catch (error) {
    console.error('Create FD card error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/company/expenses
// @desc    Get expenses
router.get('/expenses', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('category').optional().isString(),
  query('type').optional().isIn(['fixed', 'variable']),
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'paid']),
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
      type,
      status,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter
    const filter = {};
    if (startDate && endDate) {
      filter.expenseDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (category) {
      filter.category = category;
    }
    if (type) {
      filter.type = type;
    }
    if (status) {
      filter.status = status;
    }

    // Get expenses with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const expenses = await Expense.find(filter)
      .populate('company', 'name')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get summary statistics
    const summary = await Expense.aggregate([
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
    const categoryBreakdown = await Expense.aggregate([
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
    const total = await Expense.countDocuments(filter);

    res.json({
      success: true,
      data: {
        expenses,
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
    console.error('Expenses error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/company/expenses
// @desc    Create expense
router.post('/expenses', requirePermission('manage_company'), [
  body('company').isMongoId().withMessage('Valid company ID is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('category').isIn([
    'office_rent', 'utilities', 'salaries', 'equipment', 'software',
    'marketing', 'travel', 'meals', 'insurance', 'legal',
    'accounting', 'maintenance', 'other'
  ]).withMessage('Valid category is required'),
  body('type').isIn(['fixed', 'variable']).withMessage('Valid type is required'),
  body('expenseDate').isISO8601().withMessage('Valid expense date is required')
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

    const expense = new Expense({
      ...req.body,
      createdBy: req.user.id
    });

    await expense.save();
    await expense.populate('company', 'name');
    await expense.populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/company/projects
// @desc    Get projects
router.get('/projects', [
  query('status').optional().isIn(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
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

    const { status, priority, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (priority) {
      filter.priority = priority;
    }

    // Get projects with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const projects = await Project.find(filter)
      .populate('company', 'name')
      .populate('createdBy', 'name')
      .populate('teamMembers.user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get summary statistics
    const summary = await Project.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalBudget: { $sum: '$budget' },
          totalActualCost: { $sum: '$actualCost' },
          averageProgress: { $avg: '$progress' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get status breakdown
    const statusBreakdown = await Project.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBudget: { $sum: '$budget' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get total count
    const total = await Project.countDocuments(filter);

    res.json({
      success: true,
      data: {
        projects,
        summary: summary[0] || {
          totalBudget: 0,
          totalActualCost: 0,
          averageProgress: 0,
          count: 0
        },
        statusBreakdown,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Projects error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/company/projects
// @desc    Create project
router.post('/projects', requirePermission('manage_company'), [
  body('company').isMongoId().withMessage('Valid company ID is required'),
  body('name').notEmpty().withMessage('Project name is required'),
  body('projectCode').notEmpty().withMessage('Project code is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('budget').optional().isNumeric().withMessage('Budget must be a number')
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

    const project = new Project({
      ...req.body,
      createdBy: req.user.id
    });

    await project.save();
    await project.populate('company', 'name');
    await project.populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
