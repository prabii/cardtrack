const mongoose = require('mongoose');

const companyProfitSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  period: {
    type: String,
    required: true,
    enum: ['monthly', 'quarterly', 'yearly']
  },
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    min: 1,
    max: 12
  },
  quarter: {
    type: Number,
    min: 1,
    max: 4
  },
  revenue: {
    type: Number,
    required: true,
    default: 0
  },
  expenses: {
    type: Number,
    required: true,
    default: 0
  },
  netProfit: {
    type: Number,
    required: true,
    default: 0
  },
  profitMargin: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Calculate net profit and profit margin before saving
companyProfitSchema.pre('save', function(next) {
  this.netProfit = this.revenue - this.expenses;
  this.profitMargin = this.revenue > 0 ? (this.netProfit / this.revenue) * 100 : 0;
  next();
});

// Index for better query performance
companyProfitSchema.index({ company: 1, year: 1, month: 1 });
companyProfitSchema.index({ company: 1, year: 1, quarter: 1 });
companyProfitSchema.index({ period: 1, year: 1 });

module.exports = mongoose.model('CompanyProfit', companyProfitSchema);
