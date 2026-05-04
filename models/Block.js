const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  type: {
    type: String,
    enum: [
      'link',
      'image',
      'video',
      'heading',
      'quote',
      'text',
      'social',
      'map',
      'spotify',
      'github',
      'youtube'
    ],
    required: true,
    index: true
  },

  position: {
    i: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    w: { type: Number, required: true, min: 1, max: 4 },
    h: { type: Number, required: true, min: 1, max: 4 }
  },

  // ✅ FIXED CONTENT
  content: {
    title: String,
    description: String,

    // link/social
    url: String,
    logo: String, // ✅ IMPORTANT FIX

    // image
    imageUrl: String,
    imagePublicId: String,

    // video
    videoUrl: String,
    videoPublicId: String,

    // embed
    embedCode: String,

    // integrations
    githubUsername: String,
    youtubeChannelId: String,

    // cache
    cachedData: mongoose.Schema.Types.Mixed,
    lastFetchedAt: Date
  },

  style: {
    width: { type: String, default: '1x1', enum: ['1x1', '2x1', '1x2', '2x2', 'full'] }, // ✅ ADD THIS
    backgroundColor: String,
    textColor: String,
    borderRadius: String,
    fontSize: String,
    isHighlighted: { type: Boolean, default: false }
  },

  isActive: { type: Boolean, default: true, index: true },
  isDraft: { type: Boolean, default: false },

  clicks: { type: Number, default: 0 },
  views: { type: Number, default: 0 },

  order: { type: Number, default: 0, index: true }

}, { timestamps: true });

blockSchema.index({ userId: 1, isActive: 1 });
blockSchema.index({ userId: 1, order: 1 });

module.exports = mongoose.model('Block', blockSchema);