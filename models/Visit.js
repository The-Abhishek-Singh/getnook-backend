const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  visitorId: { type: String },
  deviceType: { type: String, enum: ['mobile', 'desktop', 'tablet', 'unknown'], default: 'unknown' },
  referrer: { type: String, default: 'direct' },
  source: { type: String, enum:['direct', 'social', 'link'], default: 'direct' , index:true},
  blockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Block' },
  visitedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Visit', visitSchema);