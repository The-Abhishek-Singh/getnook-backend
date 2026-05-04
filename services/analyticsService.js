const mongoose = require('mongoose');
const Visit = require('../models/Visit');
const Block = require('../models/Block');

class AnalyticsService {

    /**
     * Fetch Bento-level analytics for a user
     * @param {String} userId - Mongo ObjectId string
     * @param {Boolean} isOwner - Whether requesting user is the owner
     */
    static async fetchBentoAnalytics(userId, isOwner = false) {
        const uid = new mongoose.Types.ObjectId(userId);

        // Total profile views
        const totalProfileViews = await Visit.countDocuments({ userId: uid });

        // Device stats
        const deviceStats = await Visit.aggregate([
            { $match: { userId: uid } },
            { $group: { _id: "$deviceType", count: { $sum: 1 } } }
        ]);

        // Referrer stats
        const referrerStats = await Visit.aggregate([
            { $match: { userId: uid } },
            { $group: { _id: "$referrer", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Daily views (last 30 days)
        const dailyStats = await Visit.aggregate([
            { $match: { userId: uid, visitedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$visitedAt" } }, views: { $sum: 1 } } },
            { $sort: { "_id": 1 } }
        ]);

        // Per-block views (only for owner)
        let blockStats = [];
        if (isOwner) {
            const blocks = await Block.find({ userId: uid });
            const blockIds = blocks.map(b => b._id);

            blockStats = await Visit.aggregate([
                { $match: { userId: uid, blockId: { $in: blockIds } } },
                { $group: { _id: "$blockId", views: { $sum: 1 } } }
            ]);
        }

        return {
            totalProfileViews,
            deviceStats,
            referrerStats,
            dailyStats,
            blockStats
        };
    }
}

module.exports = AnalyticsService;