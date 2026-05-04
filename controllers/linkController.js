const axios = require("axios");
const Link = require("../models/Link"); // Adjust path as needed

// Helper to ensure URL has a protocol
const ensureProtocol = (url) => {
    if (!/^https?:\/\//i.test(url)) {
        return `https://${url}`;
    }
    return url;
};

exports.addLink = async (req, res) => {
console.log("Received URL for preview:", req.body.url); // Debug log
    try {
        let { url } = req.body;

        if (!url) {
            return res.status(400).json({ message: "URL is required" });
        }

        // 1. Sanitize the URL (Fixes the EINVALURL error)
        const sanitizedUrl = ensureProtocol(url.trim());

        // 2. Call Microlink API
        const microlinkRes = await axios.get(
            `https://api.microlink.io/?url=${encodeURIComponent(sanitizedUrl)}`
        );

        const data = microlinkRes.data.data;
        console.log("Microlink API Response:", data); // Debug log
        // 3. Build link object with fallbacks
        const newLink = new Link({
            user: req.user.id,
            url: sanitizedUrl,
            title: data.title || "No title",
            description: data.description || "",
            logo: data.logo?.url || `https://logo.clearbit.com/${new URL(sanitizedUrl).hostname}`,
            image: data.image?.url || "",
            publisher: data.publisher || new URL(sanitizedUrl).hostname
        });

        await newLink.save();
        res.status(201).json(newLink);

    } catch (error) {
        // Log the specific error for your backend console
        console.error("Link Preview Error:", error.response?.data || error.message);

        // If Microlink specifically failed, tell the user why
        if (error.response?.status === 400) {
            return res.status(400).json({
                message: "Invalid URL provided to preview service",
                details: error.response.data.message
            });
        }

        res.status(500).json({ message: "Error creating link preview" });
    }
};