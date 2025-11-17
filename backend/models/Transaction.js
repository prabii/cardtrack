const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  statement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Statement',
    required: true
  },
  cardholder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cardholder',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true
  },
  balance: {
    type: Number,
    default: null
  },
  category: {
    type: String,
    enum: ['bills', 'withdrawals', 'orders', 'fees', 'personal_use', 'unclassified'],
    default: 'unclassified'
  },
  // Order sub-classification (only applicable when category is 'orders')
  orderSubcategory: {
    type: String,
    enum: ['cb_won', 'ref', 'loss', 'running'],
    default: null,
    required: false
  },
  // Payout information (for orders)
  payoutReceived: {
    type: Boolean,
    default: false
  },
  payoutAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  verified: {
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
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better performance
transactionSchema.index({ statement: 1 });
transactionSchema.index({ cardholder: 1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ orderSubcategory: 1 });
transactionSchema.index({ verified: 1 });
transactionSchema.index({ isDeleted: 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(this.amount);
});

// Virtual for formatted balance
transactionSchema.virtual('formattedBalance').get(function() {
  if (this.balance === null) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(this.balance);
});

// Method to verify transaction
transactionSchema.methods.verify = function(userId) {
  this.verified = true;
  this.verifiedBy = userId;
  this.verifiedAt = new Date();
  return this.save();
};

// Method to unverify transaction
transactionSchema.methods.unverify = function() {
  this.verified = false;
  this.verifiedBy = null;
  this.verifiedAt = null;
  return this.save();
};

// Method to reject transaction
transactionSchema.methods.rejectTransaction = function(userId, notes = '') {
  this.verified = false;
  this.verifiedBy = userId;
  this.verifiedAt = new Date();
  if (notes) {
    this.notes = notes;
  }
  return this.save();
};

// Method to dispute transaction
transactionSchema.methods.disputeTransaction = function(notes = '') {
  this.verified = false;
  this.verifiedBy = null;
  this.verifiedAt = null;
  if (notes) {
    this.notes = (this.notes ? this.notes + '\n' : '') + `[DISPUTED] ${notes}`;
  }
  return this.save();
};

// Method to update category
transactionSchema.methods.updateCategory = function(category, userId = null) {
  this.category = category;
  if (userId) {
    this.verified = true;
    this.verifiedBy = userId;
    this.verifiedAt = new Date();
  }
  return this.save();
};

// Method to soft delete
transactionSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedBy = userId;
  this.deletedAt = new Date();
  return this.save();
};

// Method to restore
transactionSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedBy = null;
  this.deletedAt = null;
  return this.save();
};

// Static method to get transactions by statement
transactionSchema.statics.findByStatement = function(statementId) {
  return this.find({ statement: statementId, isDeleted: false })
    .populate('verifiedBy', 'name email')
    .sort({ date: -1 });
};

// Static method to get transactions by cardholder
transactionSchema.statics.findByCardholder = function(cardholderId, filters = {}) {
  const query = { cardholder: cardholderId, isDeleted: false };
  
  if (filters.category) {
    query.category = filters.category;
  }
  
  if (filters.verified !== undefined) {
    query.verified = filters.verified;
  }
  
  if (filters.startDate && filters.endDate) {
    query.date = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }
  
  return this.find(query)
    .populate('statement', 'month year')
    .populate('verifiedBy', 'name email')
    .sort({ date: -1 });
};

// Static method to get transaction statistics
transactionSchema.statics.getStatistics = function(filters = {}) {
  const matchStage = { isDeleted: false };
  
  if (filters.cardholder) {
    matchStage.cardholder = filters.cardholder;
  }
  
  if (filters.statement) {
    matchStage.statement = filters.statement;
  }
  
  if (filters.startDate && filters.endDate) {
    matchStage.date = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        averageAmount: { $avg: '$amount' },
        verifiedCount: {
          $sum: { $cond: ['$verified', 1, 0] }
        }
      }
    },
    {
      $group: {
        _id: null,
        categories: { $push: '$$ROOT' },
        totalTransactions: { $sum: '$count' },
        totalAmount: { $sum: '$totalAmount' },
        totalVerified: { $sum: '$verifiedCount' }
      }
    }
  ]);
};

// Method to get public info (exclude sensitive data)
transactionSchema.methods.getPublicInfo = function() {
  return {
    _id: this._id,
    statement: this.statement,
    cardholder: this.cardholder,
    date: this.date,
    description: this.description,
    amount: this.amount,
    formattedAmount: this.formattedAmount,
    balance: this.balance,
    formattedBalance: this.formattedBalance,
    category: this.category,
    orderSubcategory: this.orderSubcategory,
    payoutReceived: this.payoutReceived,
    payoutAmount: this.payoutAmount,
    verified: this.verified,
    verifiedBy: this.verifiedBy,
    verifiedAt: this.verifiedAt,
    notes: this.notes,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('Transaction', transactionSchema);