const express = require("express");
const router = express.Router();

const {
  generateQRCode,
  getMyQRCode,
  trackAndRedirect,
  regenerateQRCode
} = require("../controllers/qrController");

const { protect } = require("../middleware/authMiddleware");


router.post("/generate", protect, generateQRCode);
router.get("/me", protect, getMyQRCode);
router.get("/:shortCode", trackAndRedirect);
router.put("/regenerate", protect, regenerateQRCode);

module.exports = router;