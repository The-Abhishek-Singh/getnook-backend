const detectPlatform = require("./utils/detectPlatform");
const socialQueue = require("./queue/socialQueue");

const enqueueSocialFetch = async (block) => {
    const url = block?.content?.url;

    if (!url) {
        return;
    }

    const platform = detectPlatform(url);

    if (platform === "unknown") {
        return;
    }

    await socialQueue.add(
    "fetch-social",
    {
        blockId: block._id,
        platform,
        url: block.content.url,
    },
    {
        jobId: `social-${block._id}`,

        attempts: 3,

        backoff: {
            type: "exponential",
            delay: 5000,
        },

        removeOnComplete: 100,

        removeOnFail: 50,
    }
);
};

module.exports = {
    enqueueSocialFetch,
};