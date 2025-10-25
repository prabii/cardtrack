const mongoose = require('mongoose');

const cardholderSchema = new mongoose.Schema({
  // Personal Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]{10,}$/, 'Please use a valid phone number']
  },
  address: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  dob: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        const today = new Date();
        const age = today.getFullYear() - value.getFullYear();
        return age >= 18;
      },
      message: 'Cardholder must be at least 18 years old'
    }
  },

  // Family Information
  fatherName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  motherName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  // Emergency Contact (Optional)
  emergencyContact: {
    name: {
      type: String,
      trim: true,
      maxlength: 100
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]{10,}$/, 'Please use a valid phone number']
    }
  },

  // Additional Information
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  // Status and Management
  status: {
    type: String,
    enum: ['active', 'pending', 'inactive', 'suspended'],
    default: 'pending'
  },
  
  // Financial Information
  totalOutstanding: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // System Information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastLogin: {
    type: Date
  },

  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better performance
cardholderSchema.index({ email: 1 });
cardholderSchema.index({ phone: 1 });
cardholderSchema.index({ status: 1 });
cardholderSchema.index({ createdAt: -1 });
cardholderSchema.index({ isDeleted: 1 });

// Virtual for age calculation
cardholderSchema.virtual('age').get(function() {
  if (!this.dob) return null;
  const today = new Date();
  const age = today.getFullYear() - this.dob.getFullYear();
  const monthDiff = today.getMonth() - this.dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.dob.getDate())) {
    return age - 1;
  }
  return age;
});

// Virtual for full name with initials
cardholderSchema.virtual('initials').get(function() {
  if (!this.name) return '';
  return this.name.split(' ').map(n => n[0]).join('').toUpperCase();
});

// Pre-save middleware
cardholderSchema.pre('save', function(next) {
  // Update lastUpdatedBy if modified
  if (this.isModified() && !this.isNew) {
    this.lastUpdatedBy = this.constructor.currentUser;
  }
  next();
});

// Instance methods
cardholderSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    address: this.address,
    dob: this.dob,
    fatherName: this.fatherName,
    motherName: this.motherName,
    emergencyContact: this.emergencyContact,
    notes: this.notes,
    status: this.status,
    totalOutstanding: this.totalOutstanding,
    age: this.age,
    initials: this.initials,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

cardholderSchema.methods.updateStatus = function(newStatus, updatedBy) {
  this.status = newStatus;
  this.lastUpdatedBy = updatedBy;
  return this.save();
};

cardholderSchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

// Static methods
cardholderSchema.statics.findActive = function() {
  return this.find({ status: 'active', isDeleted: false });
};

cardholderSchema.statics.findByStatus = function(status) {
  return this.find({ status, isDeleted: false });
};

cardholderSchema.statics.searchCardholders = function(query) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    isDeleted: false,
    $or: [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { fatherName: searchRegex },
      { motherName: searchRegex }
    ]
  });
};

// Ensure virtual fields are serialized
cardholderSchema.set('toJSON', { virtuals: true });
cardholderSchema.set('toObject', { virtuals: true });

const Cardholder = mongoose.model('Cardholder', cardholderSchema);

module.exports = Cardholder;
