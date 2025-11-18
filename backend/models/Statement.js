const mongoose = require('mongoose');

const statementSchema = new mongoose.Schema({
  // Cardholder reference
  cardholder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cardholder',
    required: true
  },

  // Statement Information
  month: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2030
  },
  timePeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },

  // Card Information
  cardDigits: {
    type: String,
    required: true,
    match: [/^\d{4}$/, 'Card digits must be exactly 4 digits']
  },
  bankName: {
    type: String,
    required: true,
    trim: true
  },
  cardNumber: {
    type: String,
    required: true,
    trim: true
  },

  // File Information
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true,
    default: 'application/pdf'
  },

  // Processing Status
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'processed', 'failed', 'pending'],
    default: 'uploaded'
  },
  processingError: {
    type: String
  },

  // Extracted Data
  extractedData: {
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD'],
      default: 'USD'
    },
    totalTransactions: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    cardLimit: {
      type: Number,
      default: 0
    },
    availableLimit: {
      type: Number,
      default: 0
    },
    outstandingAmount: {
      type: Number,
      default: 0
    },
    minimumPayment: {
      type: Number,
      default: 0
    },
    dueDate: {
      type: Date
    }
  },

  // Deadline Information
  deadline: {
    type: Date,
    required: true
  },

  // System Information
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
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
statementSchema.index({ cardholder: 1 });
statementSchema.index({ month: 1, year: 1 });
statementSchema.index({ status: 1 });
statementSchema.index({ deadline: 1 });
statementSchema.index({ isDeleted: 1 });
statementSchema.index({ createdAt: -1 });

// Virtual for full month-year
statementSchema.virtual('fullMonth').get(function() {
  return `${this.month} ${this.year}`;
});

// Virtual for days until deadline
statementSchema.virtual('daysUntilDeadline').get(function() {
  if (!this.deadline) return null;
  const today = new Date();
  const diffTime = this.deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is overdue
statementSchema.virtual('isOverdue').get(function() {
  if (!this.deadline) return false;
  return new Date() > this.deadline && this.status !== 'processed';
});

// Pre-save middleware
statementSchema.pre('save', function(next) {
  // Set processedAt when status changes to processed
  if (this.isModified('status') && this.status === 'processed') {
    this.processedAt = new Date();
  }
  
  next();
});

// Instance methods
statementSchema.methods.getPublicInfo = function() {
  return {
    id: this._id,
    cardholder: this.cardholder,
    month: this.month,
    year: this.year,
    fullMonth: this.fullMonth,
    timePeriod: this.timePeriod,
    cardDigits: this.cardDigits,
    bankName: this.bankName,
    status: this.status,
    extractedData: this.extractedData,
    deadline: this.deadline,
    daysUntilDeadline: this.daysUntilDeadline,
    isOverdue: this.isOverdue,
    uploadedBy: this.uploadedBy,
    processedBy: this.processedBy,
    processedAt: this.processedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

statementSchema.methods.updateStatus = function(newStatus, processedBy) {
  this.status = newStatus;
  if (newStatus === 'processed') {
    this.processedBy = processedBy;
    this.processedAt = new Date();
  }
  return this.save();
};

statementSchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

// Static methods
statementSchema.statics.findByCardholder = function(cardholderId) {
  return this.find({ cardholder: cardholderId, isDeleted: false }).sort({ createdAt: -1 });
};

statementSchema.statics.findOverdue = function() {
  return this.find({
    deadline: { $lt: new Date() },
    status: { $ne: 'processed' },
    isDeleted: false
  });
};

statementSchema.statics.findPending = function() {
  return this.find({
    status: { $in: ['uploaded', 'processing', 'pending'] },
    isDeleted: false
  });
};

statementSchema.statics.findByMonth = function(month, year) {
  return this.find({
    month,
    year,
    isDeleted: false
  });
};

// Ensure virtual fields are serialized
statementSchema.set('toJSON', { virtuals: true });
statementSchema.set('toObject', { virtuals: true });

const Statement = mongoose.model('Statement', statementSchema);

module.exports = Statement;
