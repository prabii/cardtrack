const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin, requireManager, requirePermission } = require('../middleware/roles');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// @route   GET /api/users
// @desc    Get all users (Admin/Manager only)
router.get('/', requireManager, [
  query('search').optional().isString().trim(),
  query('role').optional().isIn(['admin', 'manager', 'member', 'gateway_manager']),
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
      search = '',
      role,
      status,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      filter.role = role;
    }
    
    if (status) {
      filter.isActive = status === 'active';
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users with pagination
    const users = await User.find(filter)
      .select('-password -otpCode -otpExpires -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Get statistics
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      },
      stats: stats.reduce((acc, stat) => {
        acc[stat._id] = { total: stat.count, active: stat.active };
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -otpCode -otpExpires -resetPasswordToken -resetPasswordExpires');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user can view this profile
    if (req.user.id !== req.params.id && !req.user.hasAnyRole(['admin', 'manager'])) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isString().trim(),
  body('address').optional().isString().trim(),
  body('role').optional().isIn(['admin', 'manager', 'member', 'gateway_manager']),
  body('permissions').optional().isArray(),
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

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check permissions
    if (req.user.id !== req.params.id) {
      if (!req.user.hasAnyRole(['admin', 'manager'])) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }
      
      // Only admin can change roles and permissions
      if (req.body.role && !req.user.hasRole('admin')) {
        return res.status(403).json({ 
          success: false, 
          message: 'Only admin can change user roles' 
        });
      }
    }

    // Update user
    const updateData = { ...req.body };
    delete updateData.password; // Don't allow password update here
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -otpCode -otpExpires -resetPasswordToken -resetPasswordExpires');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (req.user.id === req.params.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role (Admin only)
router.put('/:id/role', requireAdmin, [
  body('role').isIn(['admin', 'manager', 'member', 'gateway_manager']).withMessage('Invalid role'),
  body('permissions').optional().isArray()
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

    const { role, permissions } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent admin from changing their own role
    if (req.user.id === req.params.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot change your own role' 
      });
    }

    // Set default permissions based on role if not provided
    const getDefaultPermissions = (userRole) => {
      const permissionMap = {
        admin: [
          'view_cardholders', 'create_cardholders', 'edit_cardholders', 'delete_cardholders',
          'view_bill_payments', 'create_bill_payments', 'process_bill_payments',
          'view_gateways', 'manage_gateways', 'view_reports', 'manage_company',
          'manage_users', 'view_all_data'
        ],
        manager: [
          'view_cardholders', 'create_cardholders', 'edit_cardholders', 'delete_cardholders',
          'view_bill_payments', 'create_bill_payments', 'process_bill_payments',
          'view_reports', 'view_all_data'
        ],
        member: [
          'view_cardholders', 'create_cardholders', 'edit_cardholders',
          'view_bill_payments', 'create_bill_payments'
        ],
        gateway_manager: [
          'view_gateways', 'manage_gateways', 'view_bill_payments', 'process_bill_payments',
          'view_reports', 'view_all_data'
        ],
        operator: [
          'view_cardholders', 'edit_cardholders',
          'view_bill_payments', 'process_bill_payments',
          'view_transactions', 'verify_transactions',
          'view_gateways',
          'view_reports', 'manage_alerts'
        ]
      };
      return permissionMap[userRole] || permissionMap.member;
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        role,
        permissions: permissions || getDefaultPermissions(role)
      },
      { new: true, runValidators: true }
    ).select('-password -otpCode -otpExpires -resetPasswordToken -resetPasswordExpires');

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/users/me/profile
// @desc    Get current user profile
router.get('/me/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -otpCode -otpExpires -resetPasswordToken -resetPasswordExpires');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
