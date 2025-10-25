const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { verifyToken, generateTokens } = require('../middleware/auth');
// Gmail with 16-character App Password (Real Email)
const { sendOTPEmail } = require('../services/emailService');

// Alternative services (uncomment to use):
// const { sendOTPEmail } = require('../services/emailServiceConsole'); // Console (for testing)
// const { sendOTPEmail } = require('../services/emailServiceSendGrid'); // SendGrid
// const { sendOTPEmail } = require('../services/emailServiceOAuth'); // Gmail with OAuth2
// const { sendOTPEmail } = require('../services/emailServiceMailgun'); // Mailgun

const router = express.Router();

// Quick check: verify if user exists (public, diagnostic)
router.get('/check-user', async (req, res) => {
  try {
    const email = (req.query.email || '').toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email query param is required' });
    }
    const user = await User.findOne({ email }).select('email role isActive createdAt');
    res.json({ success: true, exists: !!user, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;
    const role = 'member'; // Only allow member signup

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Set default permissions based on role
    const getDefaultPermissions = (userRole) => {
      const permissions = {
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
        ]
      };
      return permissions[userRole] || permissions.member;
    };

    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: role,
      permissions: getDefaultPermissions(role)
    });

    await newUser.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: newUser._id,
      email: newUser.email,
      name: newUser.name
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser.toJSON(),
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: user._id,
      email: user.email,
      name: user.name
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: user.toJSON(),
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send OTP for password reset
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email')
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

    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    try {
      // Send OTP via email
      await sendOTPEmail(email, otp);
      
      res.json({
        success: true,
        message: 'Password reset OTP sent successfully to your email'
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // Still return success but log the error
      res.json({
        success: true,
        message: 'Password reset OTP generated successfully',
        otp: otp, // Fallback: return OTP if email fails
        emailError: 'Failed to send email, but OTP is available'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during forgot password'
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for password reset
// @access  Public
router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
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

    const { email, otp } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isOTPValid = user.verifyOTP(otp);
    if (!isOTPValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with OTP
// @access  Public
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
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

    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isOTPValid = user.verifyOTP(otp);
    if (!isOTPValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Update password
    user.password = newPassword;
    user.clearOTP();
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', verifyToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

// @route   POST /api/auth/login/admin
// @desc    Login admin user
// @access  Public
router.post('/login/admin', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
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

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase(), role: 'admin' });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Admin access denied'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const { accessToken, refreshToken } = generateTokens({
      id: user._id,
      email: user.email,
      name: user.name
    });

    res.json({
      success: true,
      message: 'Admin login successful',
      user: user.toJSON(),
      tokens: { accessToken, refreshToken }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin login'
    });
  }
});

// @route   POST /api/auth/login/manager
// @desc    Login manager user
// @access  Public
router.post('/login/manager', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
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

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase(), role: 'manager' });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Manager access denied'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const { accessToken, refreshToken } = generateTokens({
      id: user._id,
      email: user.email,
      name: user.name
    });

    res.json({
      success: true,
      message: 'Manager login successful',
      user: user.toJSON(),
      tokens: { accessToken, refreshToken }
    });
  } catch (error) {
    console.error('Manager login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during manager login'
    });
  }
});

// @route   POST /api/auth/login/gateway
// @desc    Login gateway manager user
// @access  Public
router.post('/login/gateway', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
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

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase(), role: 'gateway_manager' });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Gateway manager access denied'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const { accessToken, refreshToken } = generateTokens({
      id: user._id,
      email: user.email,
      name: user.name
    });

    res.json({
      success: true,
      message: 'Gateway manager login successful',
      user: user.toJSON(),
      tokens: { accessToken, refreshToken }
    });
  } catch (error) {
    console.error('Gateway manager login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during gateway manager login'
    });
  }
});

// Fix user permissions endpoint
router.post('/fix-permissions', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const getDefaultPermissions = (userRole) => {
      const permissions = {
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
        ]
      };
      return permissions[userRole] || permissions.member;
    };

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update user permissions based on their role
    user.permissions = getDefaultPermissions(user.role);
    await user.save();

    res.json({ 
      success: true, 
      message: 'Permissions updated successfully',
      user: {
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Fix permissions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Refresh user permissions endpoint (for logged-in users)
router.post('/refresh-permissions', verifyToken, async (req, res) => {
  try {
    const getDefaultPermissions = (userRole) => {
      const permissions = {
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
        ]
      };
      return permissions[userRole] || permissions.member;
    };

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update user permissions based on their role
    user.permissions = getDefaultPermissions(user.role);
    await user.save();

    res.json({ 
      success: true, 
      message: 'Permissions refreshed successfully',
      user: {
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Refresh permissions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
