const { Worker } = require("bullmq");
const redis = require("../../../config/redis");

const Block = require("../../../models/Block");

const getProvider = require("../providerFactory");

const worker = new Worker(
    "social-fetch",
    async (job) => {
        try {
            console.log("🚀 Social Job Started");
            console.log(job.data);

            const { blockId, platform } = job.data;

            const block = await Block.findById(blockId);

            if (!block) {
                console.log("❌ Block not found");
                return;
            }

            const provider = getProvider(platform);

            if (!provider) {
                console.log("❌ Provider not found");
                return;
            }

     try {
        const result = await provider.fetch(job.data.url);

// Compare old vs new cached data
const oldData =
    JSON.stringify(block.content?.cachedData?.profile || {}) +
    JSON.stringify(block.content?.cachedData?.items || []);

const newData = JSON.stringify(result.profile) +
                JSON.stringify(result.items);

if (oldData !== newData) {
    console.log("🆕 Social data changed. Updating cache...");

    block.content = {
    ...(block.content || {}),
    cachedData: result,
    fetchStatus: "completed",
    platform,
    lastFetchedAt: new Date(),
    lastError: null,
};

await block.save();

    console.log("✅ Cache updated");
} else {
    console.log("✅ No changes detected");

    block.content.lastFetchedAt = new Date();
    block.content.fetchStatus = "completed";
    block.content.lastError = null;

    await block.save();
}

} catch (error) {

    block.content = {
    ...(block.content || {}),
    fetchStatus: "failed",
    lastFetchedAt: new Date(),
    lastError: error.message,
};

await block.save();

    console.error("❌ Social fetch failed:", error.message);

    throw error; // Let BullMQ retry the job
}
            
            
        } catch (err) {
            console.error("❌ Worker Error");
            console.error(err);
            throw err;
        }
    },
    {
        connection: redis,

        concurrency: 4

    }
);

worker.on("ready", () => {
    console.log("✅ Social Worker Ready");
});

worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.log(`❌ Job ${job.id} failed`);
    console.error(err.message);
});

module.exports = worker;