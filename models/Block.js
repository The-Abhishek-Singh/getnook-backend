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

  url: String,
  logo: String,

  imageUrl: String,
  imagePublicId: String,

  videoUrl: String,
  videoPublicId: String,

  embedCode: String,

  githubUsername: String,
  youtubeChannelId: String,

  platform: {
      type: String,
      default: null
  },

  fetchStatus: {
      type: String,
      enum: ["pending", "fetching", "completed", "failed"],
      default: null
  },

  cachedData: mongoose.Schema.Types.Mixed,
  location: {
    type: { lat: Number, lng: Number },
    _id: false,
    default: undefined
},
  textAlign: {
        type: String,
        enum: ["left", "center", "right"],
        default: "left"
    },

  lastFetchedAt: Date
},

  style: {
  width: {
    type: String,
    default: '1x1',
    enum: [
      "1x1",
      "2x1",
      "1x2",
      "2x2",
      "full",
      "1:1",
      "3:4",
      "4:3",
      "2:3",
      "3:2",
      "9:16",
      "16:9",
      "5:4",
      "4:5",
      "21:9"
      ]
  },



  backgroundColor: String,
  textColor: String,
  borderRadius: String,
  fontSize: String,

  isHighlighted: {
    type: Boolean,
    default: false
  }
},

  isActive: { type: Boolean, default: true, index: true },
  isDraft: { type: Boolean, default: false },

  clicks: { type: Number, default: 0 },
  views: { type: Number, default: 0 },

  order: { type: Number, default: 0, index: true },
  

}, { timestamps: true });

blockSchema.index({ userId: 1, isActive: 1 });
blockSchema.index({ userId: 1, order: 1 });

module.exports = mongoose.model('Block', blockSchema);