const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    index: true
  },
  count: {
    type: Number,
    default: 1
  },
  pages: [{
    path: String,
    timestamp: Date
  }],
  sessionId: {
    type: String,
    index: true
  },
  ipHash: {
    type: String
  },
  userAgent: {
    type: String
  },
  referrer: {
    type: String,
    default: 'direct'
  }
}, {
  timestamps: true
});

visitorSchema.index({ date: 1, sessionId: 1 });
visitorSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Visitor', visitorSchema);