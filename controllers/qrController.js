const QRCode = require("../models/QRCode");
const User = require("../models/User");
const Visit = require("../models/Visit");
const QRCodeGenerator = require("qrcode");
const crypto = require("crypto");
const useragent = require("useragent");

// Generate QR for logged in user
exports.generateQRCode = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("username");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Already generated
    let existingQR = await QRCode.findOne({ userId: user._id });

    if (existingQR) {
      return res.status(200).json({
        success: true,
        qr: existingQR
      });
    }

    // Random short code
    const shortCode = crypto.randomBytes(4).toString("hex");

    // Change this to your frontend URL
    const destinationUrl = `${process.env.FRONTEND_URL}/${user.username}`;

    // QR will point to backend redirect route
    const qrUrl = `${process.env.BACKEND_URL}/api/qr/${shortCode}`;

    const qrImage = await QRCodeGenerator.toDataURL(qrUrl);

    const qr = await QRCode.create({
      userId: user._id,
      shortCode,
      destinationUrl,
      qrImage
    });

    res.status(201).json({
      success: true,
      message: "QR generated successfully",
      qr
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to generate QR",
      error: error.message
    });
  }
};


// Logged in user QR
exports.getMyQRCode = async (req, res) => {
  try {

    const qr = await QRCode.findOne({
      userId: req.user.id
    });

    if (!qr) {
      return res.status(404).json({
        success: false,
        message: "QR not found"
      });
    }

    res.json({
      success: true,
      qr
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


// Scan QR -> Track -> Redirect
exports.trackAndRedirect = async (req, res) => {

  try {

    const qr = await QRCode.findOne({
      shortCode: req.params.shortCode,
      isActive: true
    });

    if (!qr) {
      return res.status(404).send("QR not found");
    }

    const agent = useragent.parse(req.headers["user-agent"]);

    let device = "desktop";

    if (agent.device.family !== "Other") {
      device = "mobile";
    }

    if (
      req.headers["user-agent"]?.toLowerCase().includes("tablet")
    ) {
      device = "tablet";
    }

    await Visit.create({
      userId: qr.userId,
      visitorId: req.ip,
      deviceType: device,
      referrer: req.headers.referer || "direct",
      source: "qr"
    });

    return res.redirect(qr.destinationUrl);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};
 // Delete old qr or do inactive 
exports.regenerateQRCode = async (req, res) => {

    const qr = await QRCode.findOne({
        userId: req.user.id
    });

    if (!qr) {
        return res.status(404).json({
            message: "QR not found"
        });
    }

    const newShortCode = crypto.randomBytes(4).toString("hex");

    const qrUrl = `${process.env.BACKEND_URL}/api/qr/${newShortCode}`;

    const qrImage = await QRCodeGenerator.toDataURL(qrUrl);

    qr.shortCode = newShortCode;
    qr.qrImage = qrImage;

    await qr.save();

    res.json({
        success: true,
        qr
    });

};