const mongoose = require('mongoose');

const gatewayTransactionSchema = new mongoose.Schema({
  gateway: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gateway',
    required: [true, 'Gateway is required']
  },
  transactionType: {
    type: String,
    enum: ['withdrawal', 'bill', 'transfer', 'deposit'],
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  reference: {
    type: String,
    trim: true,
    default: ''
  },
  // Link to related entities
  billPayment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BillPayment',
    default: null
  },
  cardholder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cardholder',
    default: null
  },
  bank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bank',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  transactionDate: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  failureReason: {
    type: String,
    trim: true,
    default: ''
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes
gatewayTransactionSchema.index({ gateway: 1, transactionType: 1 });
gatewayTransactionSchema.index({ transactionDate: -1 });
gatewayTransactionSchema.index({ status: 1 });
gatewayTransactionSchema.index({ billPayment: 1 });

// Virtual for available funds calculation
gatewayTransactionSchema.virtual('isInflow').get(function() {
  return this.transactionType === 'withdrawal' || this.transactionType === 'deposit';
});

gatewayTransactionSchema.virtual('isOutflow').get(function() {
  return this.transactionType === 'bill' || this.transactionType === 'transfer';
});

// Static method to calculate summary
gatewayTransactionSchema.statics.getSummary = async function(gatewayId, startDate, endDate) {
  const match = { gateway: gatewayId };
  if (startDate || endDate) {
    match.transactionDate = {};
    if (startDate) match.transactionDate.$gte = new Date(startDate);
    if (endDate) match.transactionDate.$lte = new Date(endDate);
  }

  const summary = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$transactionType',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    totalWithdrawals: 0,
    totalBills: 0,
    totalTransfers: 0,
    totalDeposits: 0
  };

  summary.forEach(item => {
    switch (item._id) {
      case 'withdrawal':
        result.totalWithdrawals = item.total;
        break;
      case 'bill':
        result.totalBills = item.total;
        break;
      case 'transfer':
        result.totalTransfers = item.total;
        break;
      case 'deposit':
        result.totalDeposits = item.total;
        break;
    }
  });

  // Calculate Available Funds = (Withdrawals + Deposits) - (Bills + Transfers)
  result.availableFunds = (result.totalWithdrawals + result.totalDeposits) - 
                          (result.totalBills + result.totalTransfers);

  return result;
};

module.exports = mongoose.model('GatewayTransaction', gatewayTransactionSchema);

