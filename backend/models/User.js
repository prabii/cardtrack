const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  website: {
    type: String,
    trim: true,
    default: ''
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot be more than 500 characters'],
    default: ''
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'member', 'gateway_manager'],
    default: 'member',
    required: true
  },
  permissions: [{
    type: String,
    enum: [
      'view_cardholders',
      'create_cardholders',
      'edit_cardholders',
      'delete_cardholders',
      'view_bill_payments',
      'create_bill_payments',
      'process_bill_payments',
      'view_gateways',
      'manage_gateways',
      'view_reports',
      'manage_company',
      'manage_users',
      'view_all_data'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  otpCode: {
    type: String,
    default: null
  },
  otpExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate OTP
userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otpCode = otp;
  this.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  return otp;
};

// Role-based permission methods
userSchema.methods.hasPermission = function(permission) {
  // Admin has all permissions
  if (this.role === 'admin') return true;
  
  // Check specific permission
  return this.permissions.includes(permission);
};

userSchema.methods.hasRole = function(role) {
  return this.role === role;
};

userSchema.methods.hasAnyRole = function(roles) {
  return roles.includes(this.role);
};

// Get user's accessible modules based on role
userSchema.methods.getAccessibleModules = function() {
  const moduleAccess = {
    admin: [
      'cardholders', 'bill_payments', 'gateways', 'reports', 
      'company', 'users', 'settings', 'statements', 'bank_data'
    ],
    manager: [
      'cardholders', 'bill_payments', 'reports', 'statements', 'bank_data'
    ],
    member: [
      'cardholders', 'bill_payments', 'statements', 'bank_data'
    ],
    gateway_manager: [
      'gateways', 'bill_payments', 'reports', 'bank_data'
    ]
  };
  
  return moduleAccess[this.role] || [];
};

// Update last activity
userSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  this.isOnline = true;
  return this.save();
};

// Verify OTP
userSchema.methods.verifyOTP = function(otp) {
  return this.otpCode === otp && this.otpExpires > new Date();
};

// Clear OTP
userSchema.methods.clearOTP = function() {
  this.otpCode = null;
  this.otpExpires = null;
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  delete userObject.otpCode;
  delete userObject.otpExpires;
  return userObject;
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
