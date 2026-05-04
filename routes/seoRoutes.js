const { updateSEO } = require('../controllers/seoController');
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

router.put('/', protect, updateSEO);

module.exports = router;