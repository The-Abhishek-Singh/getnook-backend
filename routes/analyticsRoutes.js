const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getBentoAnalytics } = require('../controllers/analyticsController');

router.get('/owner', protect, getBentoAnalytics);
router.get('/public/:username', getBentoAnalytics);

module.exports = router;