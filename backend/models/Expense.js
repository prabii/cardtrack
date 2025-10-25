const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Expense title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'office_rent',
      'utilities',
      'salaries',
      'equipment',
      'software',
      'marketing',
      'travel',
      'meals',
      'insurance',
      'legal',
      'accounting',
      'maintenance',
      'other'
    ]
  },
  type: {
    type: String,
    required: [true, 'Expense type is required'],
    enum: ['fixed', 'variable']
  },
  frequency: {
    type: String,
    enum: ['one_time', 'monthly', 'quarterly', 'yearly'],
    default: 'one_time'
  },
  expenseDate: {
    type: Date,
    required: [true, 'Expense date is required']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'check', 'other'],
    default: 'card'
  },
  vendor: {
    type: String,
    trim: true,
    maxlength: [100, 'Vendor name cannot be more than 100 characters']
  },
  receiptNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Receipt number cannot be more than 50 characters']
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringEndDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
expenseSchema.index({ company: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ type: 1 });
expenseSchema.index({ expenseDate: 1 });
expenseSchema.index({ status: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
