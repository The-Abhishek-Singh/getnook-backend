const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    destinationUrl: {
      type: String,
      required: true
    },

    qrImage: {
      type: String,
      default: ""
    },

    isActive: {
      type: Boolean,
      default: true
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model("QRCode", qrCodeSchema);