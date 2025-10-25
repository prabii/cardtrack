const mongoose = require('mongoose');

const bankSchema = new mongoose.Schema({
  cardholder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cardholder',
    required: [true, 'Cardholder is required']
  },
  bankName: {
    type: String,
    required: [true, 'Bank name is required'],
    trim: true
  },
  cardNumber: {
    type: String,
    required: [true, 'Card number is required'],
    trim: true
  },
  cardType: {
    type: String,
    enum: ['Credit', 'Debit', 'Prepaid'],
    required: [true, 'Card type is required']
  },
  cardLimit: {
    type: Number,
    required: [true, 'Card limit is required'],
    min: [0, 'Card limit cannot be negative']
  },
  availableLimit: {
    type: Number,
    required: [true, 'Available limit is required'],
    min: [0, 'Available limit cannot be negative']
  },
  outstandingAmount: {
    type: Number,
    default: 0,
    min: [0, 'Outstanding amount cannot be negative']
  },
  transactionsSummary: {
    orders: {
      type: Number,
      default: 0
    },
    bills: {
      type: Number,
      default: 0
    },
    withdrawals: {
      type: Number,
      default: 0
    },
    fees: {
      type: Number,
      default: 0
    },
    personal: {
      type: Number,
      default: 0
    }
  },
  summary: {
    toGive: {
      type: Number,
      default: 0
    },
    toTake: {
      type: Number,
      default: 0
    },
    profit: {
      type: Number,
      default: 0
    },
    loss: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'closed'],
    default: 'active'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
bankSchema.index({ cardholder: 1 });
bankSchema.index({ bankName: 1 });
bankSchema.index({ cardNumber: 1 });

// Virtual for masked card number
bankSchema.virtual('maskedCardNumber').get(function() {
  if (this.cardNumber && this.cardNumber.length >= 4) {
    return '****' + this.cardNumber.slice(-4);
  }
  return this.cardNumber;
});

// Method to update available limit
bankSchema.methods.updateAvailableLimit = function() {
  this.availableLimit = this.cardLimit - this.outstandingAmount;
  this.lastUpdated = new Date();
  return this.save();
};

// Method to add transaction
bankSchema.methods.addTransaction = function(amount, category) {
  this.outstandingAmount += amount;
  this.availableLimit = this.cardLimit - this.outstandingAmount;
  
  // Update transaction summary
  if (this.transactionsSummary[category] !== undefined) {
    this.transactionsSummary[category] += amount;
  }
  
  this.lastUpdated = new Date();
  return this.save();
};

// Method to calculate summary
bankSchema.methods.calculateSummary = function() {
  const totalTransactions = Object.values(this.transactionsSummary).reduce((sum, val) => sum + val, 0);
  
  this.summary.toGive = this.availableLimit;
  this.summary.toTake = this.outstandingAmount;
  this.summary.profit = this.cardType === 'Debit' ? this.availableLimit : 0;
  this.summary.loss = this.outstandingAmount;
  
  return this.save();
};

module.exports = mongoose.models.Bank || mongoose.model('Bank', bankSchema);