const mongoose = require('mongoose');

const waterEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: () => new Date().setHours(0, 0, 0, 0)
  },
  amount: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    default: 'ml'
  },
  time: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

waterEntrySchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('WaterEntry', waterEntrySchema);
