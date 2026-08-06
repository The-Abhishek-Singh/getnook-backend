const cron = require("node-cron");
const refreshSocialCache = require("../services/social/refreshSocialCache");

cron.schedule("*/30 * * * *", async () => {

    console.log("Refreshing Social Cache...");

    await refreshSocialCache();

});