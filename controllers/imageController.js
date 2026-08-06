// controllers/image.controller.js

const axios = require("axios");

exports.proxyImage = async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                message: "Image URL is required",
            });
        }

        const response = await axios.get(url, {
            responseType: "stream",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                Referer: "https://www.instagram.com/",
            },
        });

        res.setHeader(
            "Content-Type",
            response.headers["content-type"] ||
                "image/jpeg"
        );

        res.setHeader(
            "Cache-Control",
            "public,max-age=86400"
        );

        response.data.pipe(res);

    } catch (err) {

        console.error(err.message);

        res.status(500).json({
            message: "Unable to fetch image",
        });
    }
};