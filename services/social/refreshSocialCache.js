const Block = require("../../models/Block");
const { enqueueSocialFetch } = require("./socialService");

async function refreshSocialCache() {
    const oneHour = 60 * 60 * 1000;

    const blocks = await Block.find({
        type: "social",
        $or: [
            {
                "cachedData.fetchedAt": {
                    $exists: false,
                },
            },
            {
                "cachedData.fetchedAt": {
                    $lt: new Date(Date.now() - oneHour),
                },
            },
        ],
    });

    console.log(`Refreshing ${blocks.length} stale social blocks`);

    for (const block of blocks) {
        await enqueueSocialFetch(block);
    }
}

module.exports = refreshSocialCache;