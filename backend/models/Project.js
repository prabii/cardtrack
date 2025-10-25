const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  projectCode: {
    type: String,
    required: [true, 'Project code is required'],
    trim: true,
    unique: true,
    maxlength: [20, 'Project code cannot be more than 20 characters']
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date
  },
  estimatedDuration: {
    type: Number, // in days
    min: [1, 'Duration must be at least 1 day']
  },
  budget: {
    type: Number,
    min: [0, 'Budget cannot be negative']
  },
  actualCost: {
    type: Number,
    default: 0,
    min: [0, 'Actual cost cannot be negative']
  },
  progress: {
    type: Number,
    min: [0, 'Progress cannot be less than 0'],
    max: [100, 'Progress cannot exceed 100'],
    default: 0
  },
  client: {
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true }
  },
  teamMembers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      required: true,
      trim: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  milestones: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    completedDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'overdue'],
      default: 'pending'
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot be more than 2000 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Calculate progress based on completed milestones
projectSchema.methods.calculateProgress = function() {
  if (this.milestones.length === 0) return 0;
  
  const completedMilestones = this.milestones.filter(milestone => milestone.status === 'completed').length;
  return Math.round((completedMilestones / this.milestones.length) * 100);
};

// Check if project is overdue
projectSchema.methods.isOverdue = function() {
  if (!this.endDate) return false;
  return new Date() > this.endDate && this.status !== 'completed';
};

// Index for better query performance
projectSchema.index({ company: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ priority: 1 });
projectSchema.index({ startDate: 1 });
projectSchema.index({ endDate: 1 });
projectSchema.index({ projectCode: 1 });

module.exports = mongoose.model('Project', projectSchema);
