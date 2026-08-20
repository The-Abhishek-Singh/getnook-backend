const express = require('express');
const router = express.Router();
const { searchLocation } = require('../controllers/geoCodeController');

router.get('/', searchLocation);

module.exports = router;