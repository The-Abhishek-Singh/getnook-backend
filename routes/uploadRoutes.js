const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

router.post('/image', protect, upload.single('image'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No image file uploaded' });

        res.json({
            imageUrl: req.file.path,
            publicId: req.file.filename
        });
    } catch (error) {
        res.status(500).json({ message: 'Image upload failed', error: error.message });
    }
});

router.post('/video', protect, upload.single('video'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No video file uploaded' });

        res.json({
            videoUrl: req.file.path,
            publicId: req.file.filename
        });
    } catch (error) {
        res.status(500).json({ message: 'Video upload failed', error: error.message });
    }
});

module.exports = router;