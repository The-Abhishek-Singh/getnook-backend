const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
// const {
//     upload,
//     cloudinary
// } = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const cloudinary = require('cloudinary')


// router.post(
//     "/image",
//     protect,
//     upload.single("image"),
//     async (req, res) => {
//         try {

//             if (!req.file) {
//                 return res.status(400).json({
//                     message: "No image uploaded"
//                 });
//             }

//             console.time("Cloudinary SDK");

//             const result = await new Promise((resolve, reject) => {

//                 const stream = cloudinary.uploader.upload_stream(
//                     {
//                         folder: "GetNook",
//                         resource_type: "image"
//                     },
//                     (err, result) => {

//                         if (err) return reject(err);

//                         resolve(result);
//                     }
//                 );

//                 stream.end(req.file.buffer);

//             });

//             console.timeEnd("Cloudinary SDK");

//             res.json({
//                 imageUrl: result.secure_url,
//                 publicId: result.public_id
//             });

//         } catch (err) {

//             console.error(err);

//             res.status(500).json({
//                 message: err.message
//             });

//         }
//     }
// );

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