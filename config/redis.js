const IORedis = require("ioredis");

const redis = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});

redis.on("connect", () => {
    console.log("✅ Redis Connected");
});

redis.on("ready", () => {
    console.log("🚀 Redis Ready");
});

redis.on("error", (err) => {
    console.error("❌ Redis Error:", err.message);
});
redis.info("server").then((info) => {
    const version = info.match(/redis_version:(.+)/)?.[1]?.trim();
    console.log("Connected Redis Version:", version);
});
module.exports = redis;