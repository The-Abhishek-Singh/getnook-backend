const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    sparse: true,
    match: [/^[a-zA-Z0-9_]+$/, 'Username sirf alphanumeric aur underscore ho sakta hai']
  },

  email: { type: String, required: true, unique: true, lowercase: true },

  password: {
    type: String,
    required: function () { return this.authProvider === 'local'; },
    select: false
  },

  authProvider: { type: String, enum: ['local', 'google', 'github'], default: 'local' },
  providerId: { type: String, default: null },

  profile: {
    displayName: { type: String, required: true, maxLength: 50 },
    bio: { type: String, maxLength: 250, default: "" },
    avatarUrl: { type: String, default: "" },
    location: { type: String, default: "" }
  },

  seo: {
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    ogImage: { type: String, default: "" }
  },

  theme: {
    backgroundColor: { type: String, default: "#F3F4F6" },
    textColor: { type: String, default: "#111827" },
    fontFamily: { type: String, default: "Inter" },
    blockStyle: { type: String, enum: ['rounded-md', 'rounded-xl', 'rounded-full', 'sharp'], default: 'rounded-xl' }
  },

  socials: {
    type: Map,
    of: String,
    default: {}
  },

  integrations: {
    spotify: {
      accessToken: { type: String },
      refreshToken: { type: String },
      connectedAt: { type: Date }
    },
    github: { username: { type: String } },
    youtube: { channelId: { type: String } }
  },
   refreshToken: {
   type: String,
   default: null
   },
  isPublished: { type: Boolean, default: true },

  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);