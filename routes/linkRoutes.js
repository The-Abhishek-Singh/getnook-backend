const express = require("express");
const router = express.Router();
const { addLink } = require("../controllers/linkController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, addLink);

module.exports = router;