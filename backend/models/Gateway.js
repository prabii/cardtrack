const mongoose = require('mongoose');

const gatewaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Gateway name is required'],
    enum: ['PayPoint', 'InstantMudra'],
    unique: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    apiKey: {
      type: String,
      default: ''
    },
    apiSecret: {
      type: String,
      default: ''
    },
    endpoint: {
      type: String,
      default: ''
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
gatewaySchema.index({ name: 1 });
gatewaySchema.index({ isActive: 1 });

module.exports = mongoose.model('Gateway', gatewaySchema);

