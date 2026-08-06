const { chromium } = require("playwright");
const BaseProvider = require("./BaseProvider");

class CommonProvider extends BaseProvider {

    async fetch(url) {

        const browser = await chromium.launch({
            headless: true,
        });

        const page = await browser.newPage();

        try {

            await page.goto(url, {
                waitUntil: "domcontentloaded",
                timeout: 30000,
            });

            const meta = await page.evaluate(() => {

                const getMeta = (selector) =>
                    document.querySelector(selector)?.content || "";

                const getHref = (selector) =>
                    document.querySelector(selector)?.href || "";

                return {

                    title:
                        getMeta('meta[property="og:title"]') ||
                        document.title ||
                        "",

                    description:
                        getMeta('meta[property="og:description"]') ||
                        getMeta('meta[name="description"]') ||
                        "",

                    image:
                        getMeta('meta[property="og:image"]') ||
                        "",

                    siteName:
                        getMeta('meta[property="og:site_name"]') ||
                        "",

                    favicon:
                        getHref('link[rel="icon"]') ||
                        getHref('link[rel="shortcut icon"]') ||
                        getHref('link[rel*="icon"]') ||
                        "/favicon.ico",
                };
            });

            await browser.close();

            return this.normalize(meta, url);

        } catch (error) {

            await browser.close();

            throw new Error(
                `Failed to fetch website metadata: ${error.message}`
            );
        }
    }

    normalize(meta, url) {

        const base = new URL(url);

        const resolve = (value) => {
            if (!value) return "";

            try {
                return new URL(value, base.origin).href;
            } catch {
                return value;
            }
        };

        return {

            platform: "website",

            fetchedAt: new Date(),

            profile: {

                title: meta.title,

                displayName:
                    meta.siteName ||
                    meta.title ||
                    base.hostname,

                description: meta.description,

                favicon: resolve(meta.favicon),

                preview: resolve(meta.image),

                url: base.origin,
            },

            items: [],
        };
    }
}

module.exports = new CommonProvider();