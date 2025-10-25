const mongoose = require('mongoose');

const fdCardSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  cardNumber: {
    type: String,
    required: [true, 'Card number is required'],
    trim: true,
    unique: true
  },
  bankName: {
    type: String,
    required: [true, 'Bank name is required'],
    trim: true
  },
  accountHolder: {
    type: String,
    required: [true, 'Account holder name is required'],
    trim: true
  },
  principalAmount: {
    type: Number,
    required: [true, 'Principal amount is required'],
    min: [0, 'Principal amount cannot be negative']
  },
  interestRate: {
    type: Number,
    required: [true, 'Interest rate is required'],
    min: [0, 'Interest rate cannot be negative'],
    max: [100, 'Interest rate cannot exceed 100%']
  },
  maturityDate: {
    type: Date,
    required: [true, 'Maturity date is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  currentValue: {
    type: Number,
    default: 0
  },
  interestEarned: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'matured', 'closed', 'suspended'],
    default: 'active'
  },
  autoRenewal: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Calculate current value and interest earned before saving
fdCardSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('principalAmount') || this.isModified('interestRate') || this.isModified('startDate')) {
    const now = new Date();
    const startDate = new Date(this.startDate);
    const daysElapsed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    const yearsElapsed = daysElapsed / 365;
    
    this.interestEarned = this.principalAmount * (this.interestRate / 100) * yearsElapsed;
    this.currentValue = this.principalAmount + this.interestEarned;
  }
  next();
});

// Index for better query performance
fdCardSchema.index({ company: 1 });
fdCardSchema.index({ cardNumber: 1 });
fdCardSchema.index({ status: 1 });
fdCardSchema.index({ maturityDate: 1 });

module.exports = mongoose.model('FDCard', fdCardSchema);
