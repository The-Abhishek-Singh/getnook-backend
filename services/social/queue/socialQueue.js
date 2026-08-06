const { Queue } = require("bullmq");
const redis = require("../../../config/redis");

const socialQueue = new Queue("social-fetch", {
    connection: redis
});

module.exports = socialQueue;