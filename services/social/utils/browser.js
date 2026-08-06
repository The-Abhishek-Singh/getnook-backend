const { chromium } = require("playwright");

let browser;

async function getBrowser() {
    if (!browser || !browser.isConnected()) {
        browser = await chromium.launch({
            headless: true,
        });

        browser.on("disconnected", () => {
            browser = null;
        });
    }

    return browser;
}

async function createPage() {
    const browser = await getBrowser();

    const context = await browser.newContext({
        viewport: {
            width: 1366,
            height: 768,
        },
        locale: "en-US",
        userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();

    return { page, context };
}

module.exports = {
    getBrowser,
    createPage,
};