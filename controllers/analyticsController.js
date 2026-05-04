const AnalyticsService = require('../services/analyticsService');
const User = require('../models/User');

exports.getBentoAnalytics = async (req, res) => {
    try {
        let userId;
        let isOwner = false;

        // Owner analytics
        if (req.user) {
            userId = req.user.id;
            isOwner = true;
        } else if (req.params.username) {
            const user = await User.findOne({ username: req.params.username, isDeleted: false });
            if (!user) return res.status(404).json({ message: "User not found" });
            userId = user._id;
        } else {
            return res.status(400).json({ message: "User ID or username required" });
        }

        const analytics = await AnalyticsService.fetchBentoAnalytics(userId, isOwner);
        res.json(analytics);
    } catch (error) {
        console.error("Bento Analytics Error:", error);
        res.status(500).json({ message: "Error fetching analytics", error: error.message });
    }
};