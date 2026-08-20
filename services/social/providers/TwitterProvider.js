const BaseProvider = require("./BaseProvider");
const { createPage } = require("../utils/browser");
const { parseMeta } = require("../utils/twitterParser");

class TwitterProvider extends BaseProvider {

    extractUsername(url) {
        const match = url.match(/(?:x|twitter)\.com\/([^/?#]+)/i);

        if (!match) {
            throw new Error("Invalid Twitter/X URL");
        }

        const username = match[1];

        const reserved = [
            "i", "home", "explore", "notifications", "messages",
            "settings", "search", "compose", "hashtag",
        ];

        if (reserved.includes(username.toLowerCase())) {
            throw new Error(`"${username}" is not a profile, it's a reserved path`);
        }

        return username;
    }

    async fetch(url) {
        const username = this.extractUsername(url);
        const { page, context } = await createPage();

        try {
            await page.goto(
                `https://x.com/${username}`,
                {
                    waitUntil: "domcontentloaded",
                    timeout: 30000,
                }
            );

            await page.waitForTimeout(5000);

             await page.evaluate(() => {
             window.scrollTo(0, document.body.scrollHeight);
             });

            await page.waitForTimeout(5000);
            const html = await page.evaluate(() => {
                return document.body.innerHTML;
            });

            await page.evaluate(() => {window.scrollTo(0, 0)});

            await page.waitForTimeout(5000);

            console.log(await page.title());
            console.log(page.url());

            await page.waitForTimeout(10000);

        console.log( "Articles:", await page.locator("article").count()); const article = page.locator("article").first();
        console.log(  await article.evaluate(el => el.outerHTML.slice(0, 2000)) );

       const articleHtml = await article.innerHTML();

      console.log(articleHtml.substring(0, 1000));

      const articleCount = await page.locator("article").count();

      console.log("Articles:", articleCount);

      const articles = await page.locator("article").evaluateAll(nodes =>
       nodes.map(node => ({
        text: node.innerText.slice(0, 120),
        html: node.outerHTML.slice(0, 500)
    }))
);

console.dir(articles, { depth: null });


// List every unique data-testid on the page
const testIds = await page.evaluate(() => {
    return [...document.querySelectorAll("[data-testid]")]
        .map(el => el.getAttribute("data-testid"))
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort();
});

console.log("Data Test IDs:");
console.dir(testIds, { maxArrayLength: null });

            const profile = await this.fetchProfile(page, url);

            const items = await this.fetchContent(page);

            return this.normalize(profile, items);

        } finally {
            await context.close();
        }
    }


    async fetchProfile(page, url) {
        const username = this.extractUsername(url);

        const meta = await parseMeta(page);

        console.log("📦 X Profile:");
        console.dir(meta, { depth: null });

        return {
            id: "",
            username,
            displayName: meta.displayName,
            avatar: meta.avatar,
            bio: meta.description,
            followers: meta.followers,
            following: meta.following,
            verified: false,
            posts: meta.posts,
        };
    }

//     async fetchContent(page) {

//     const items = await page.locator("article").evaluateAll((articles) => {

//         return articles.map(article => {

//             const getMeta = (prop) =>
//                 article.querySelector(`meta[itemprop="${prop}"]`)?.content || "";

//             return {

//                 id: article.getAttribute("data-tweet-id") || "",

//                 shortcode: article.getAttribute("data-tweet-id") || "",

//                 url: getMeta("url"),

//                 thumbnail: getMeta("image"),

//                 caption: getMeta("articleBody"),

//                 comments: Number(getMeta("commentCount")) || 0,

//                 timestamp: getMeta("datePublished")
//                     ? new Date(getMeta("datePublished"))
//                     : null,

//                 type: getMeta("image") ? "image" : "text",

//                 isVideo: false,

//                 likes: 0,

//                 retweets: 0
//             };

//         });

//     });

//     console.log(`✅ Found ${items.length} X posts`);

//     console.dir(items, { depth: null });

//     return items;
// }

async fetchContent(page) {

    const items = await page.locator("article").evaluateAll((articles) => {

        return articles.map(article => {

            const getMeta = (prop) => {
                const el = article.querySelector(`:scope > meta[itemprop="${prop}"]`);
                return el?.content || "";
            };

            // Real tweet photo — actual rendered image, not schema.org author avatar
            const photoEl = article.querySelector('[data-testid="tweetPhoto"] img');
            const realThumbnail = photoEl?.src || "";

            // ⬇️ ADD IT HERE — right after getMeta is defined, alongside photoEl
            const captionEl = article.querySelector(':scope > meta[itemprop="text"]');
            const caption = captionEl?.content || "";

            const hasVideo = !!article.querySelector('[data-testid="videoPlayer"], video');

            return {

                id: article.getAttribute("data-tweet-id") || "",

                shortcode: article.getAttribute("data-tweet-id") || "",

                url: getMeta("url"),

                thumbnail: realThumbnail,

                caption,   // ⬅️ use the new variable here instead of getMeta("articleBody")

                comments: Number(getMeta("commentCount")) || 0,

                timestamp: getMeta("datePublished")
                    ? new Date(getMeta("datePublished"))
                    : null,

                type: hasVideo ? "video" : (realThumbnail ? "image" : "text"),

                isVideo: hasVideo,

                likes: 0,

                retweets: 0
            };

        });

    });

    console.log(`✅ Found ${items.length} X posts`);

    console.dir(items, { depth: null });

    return items;
}

    normalize(profile, items) {
        return {
            platform: "twitter",
            fetchedAt: new Date(),
            profile,
            items,
        };
    }
}

module.exports = new TwitterProvider();