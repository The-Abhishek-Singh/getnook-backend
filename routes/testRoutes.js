const express = require("express");
const router = express.Router();

const socialQueue = require("../services/social/queue/socialQueue");

router.get("/", async (req, res) => {
    const job = await socialQueue.add("fetch-social", {
        blockId: "123456",
        url: "https://instagram.com/openai"
    });

    res.json({
        success: true,
        jobId: job.id
    });
});

module.exports = router;