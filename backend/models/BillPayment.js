const mongoose = require('mongoose');

const billPaymentSchema = new mongoose.Schema({
  cardholder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cardholder',
    required: [true, 'Cardholder is required']
  },
  bank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bank',
    required: [true, 'Bank is required']
  },
  requestType: {
    type: String,
    enum: ['bill_payment', 'withdrawal', 'transfer', 'purchase'],
    required: [true, 'Request type is required']
  },
  billDetails: {
    billerName: {
      type: String,
      required: [true, 'Biller name is required'],
      trim: true
    },
    billerAccount: {
      type: String,
      required: [true, 'Biller account is required'],
      trim: true
    },
    billerCategory: {
      type: String,
      enum: ['utilities', 'telecom', 'insurance', 'credit_card', 'loan', 'other'],
      required: [true, 'Biller category is required']
    },
    billerSubcategory: {
      type: String,
      trim: true,
      default: ''
    },
    billerPhone: {
      type: String,
      trim: true,
      default: ''
    },
    billerEmail: {
      type: String,
      trim: true,
      default: ''
    }
  },
  paymentDetails: {
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Amount must be greater than 0']
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'INR']
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'bank_transfer', 'cash'],
      required: [true, 'Payment method is required']
    },
    paymentReference: {
      type: String,
      trim: true,
      default: ''
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurringFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      required: false
    }
  },
  requestDetails: {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requested by is required']
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    requestNotes: {
      type: String,
      trim: true,
      default: ''
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    estimatedProcessingTime: {
      type: Number, // in hours
      default: 24
    }
  },
  processingDetails: {
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    assignedAt: {
      type: Date,
      default: null
    },
    processingNotes: {
      type: String,
      trim: true,
      default: ''
    },
    processingStartedAt: {
      type: Date,
      default: null
    },
    processingCompletedAt: {
      type: Date,
      default: null
    },
    actualProcessingTime: {
      type: Number, // in hours
      default: null
    }
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'completed', 'failed', 'cancelled', 'disputed'],
    default: 'pending'
  },
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    verificationNotes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  paymentResult: {
    transactionId: {
      type: String,
      trim: true,
      default: ''
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    paymentStatus: {
      type: String,
      enum: ['success', 'failed', 'pending', 'refunded'],
      default: null
    },
    failureReason: {
      type: String,
      trim: true,
      default: ''
    },
    receiptNumber: {
      type: String,
      trim: true,
      default: ''
    },
    receiptUrl: {
      type: String,
      trim: true,
      default: ''
    }
  },
  notifications: [{
    type: {
      type: String,
      enum: ['status_update', 'payment_success', 'payment_failed', 'reminder', 'dispute'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    sentTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
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
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
billPaymentSchema.index({ cardholder: 1 });
billPaymentSchema.index({ bank: 1 });
billPaymentSchema.index({ status: 1 });
billPaymentSchema.index({ 'requestDetails.requestedBy': 1 });
billPaymentSchema.index({ 'processingDetails.assignedTo': 1 });
billPaymentSchema.index({ 'requestDetails.requestedAt': -1 });
billPaymentSchema.index({ 'paymentDetails.dueDate': 1 });
billPaymentSchema.index({ 'billDetails.billerCategory': 1 });

// Virtual for formatted amount
billPaymentSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.paymentDetails.currency || 'USD'
  }).format(this.paymentDetails.amount);
});

// Virtual for processing duration
billPaymentSchema.virtual('processingDuration').get(function() {
  if (this.processingDetails.processingStartedAt && this.processingDetails.processingCompletedAt) {
    const duration = this.processingDetails.processingCompletedAt - this.processingDetails.processingStartedAt;
    return Math.round(duration / (1000 * 60 * 60)); // hours
  }
  return null;
});

// Virtual for days until due
billPaymentSchema.virtual('daysUntilDue').get(function() {
  const today = new Date();
  const dueDate = new Date(this.paymentDetails.dueDate);
  const diffTime = dueDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to assign to operator
billPaymentSchema.methods.assignToOperator = function(operatorId, notes = '') {
  this.processingDetails.assignedTo = operatorId;
  this.processingDetails.assignedAt = new Date();
  this.processingDetails.processingNotes = notes;
  this.status = 'assigned';
  return this.save();
};

// Method to start processing
billPaymentSchema.methods.startProcessing = function(notes = '') {
  this.processingDetails.processingStartedAt = new Date();
  this.processingDetails.processingNotes = notes;
  this.status = 'in_progress';
  return this.save();
};

// Method to complete processing
billPaymentSchema.methods.completeProcessing = function(paymentResult, notes = '') {
  this.processingDetails.processingCompletedAt = new Date();
  this.processingDetails.processingNotes = notes;
  this.paymentResult = { ...this.paymentResult, ...paymentResult };
  this.status = 'completed';
  
  // Calculate actual processing time
  if (this.processingDetails.processingStartedAt) {
    const duration = this.processingDetails.processingCompletedAt - this.processingDetails.processingStartedAt;
    this.processingDetails.actualProcessingTime = Math.round(duration / (1000 * 60 * 60)); // hours
  }
  
  return this.save();
};

// Method to fail processing
billPaymentSchema.methods.failProcessing = function(failureReason, notes = '') {
  this.processingDetails.processingCompletedAt = new Date();
  this.processingDetails.processingNotes = notes;
  this.paymentResult.failureReason = failureReason;
  this.paymentResult.paymentStatus = 'failed';
  this.status = 'failed';
  return this.save();
};

// Method to add notification
billPaymentSchema.methods.addNotification = function(type, message, sentTo) {
  this.notifications.push({
    type,
    message,
    sentTo,
    sentAt: new Date()
  });
  return this.save();
};

// Method to verify payment
billPaymentSchema.methods.verifyPayment = function(verifiedBy, notes = '') {
  this.verification.isVerified = true;
  this.verification.verifiedBy = verifiedBy;
  this.verification.verifiedAt = new Date();
  this.verification.verificationNotes = notes;
  return this.save();
};

// Static method to get statistics
billPaymentSchema.statics.getStatistics = function(filters = {}) {
  const matchStage = filters;
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        pendingRequests: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        inProgressRequests: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
        },
        completedRequests: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedRequests: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        totalAmount: { $sum: '$paymentDetails.amount' },
        averageProcessingTime: { $avg: '$processingDetails.actualProcessingTime' }
      }
    }
  ]);
};

// Static method to get overdue payments
billPaymentSchema.statics.getOverduePayments = function() {
  const today = new Date();
  return this.find({
    'paymentDetails.dueDate': { $lt: today },
    status: { $in: ['pending', 'assigned', 'in_progress'] }
  }).populate('cardholder bank');
};

module.exports = mongoose.models.BillPayment || mongoose.model('BillPayment', billPaymentSchema);
