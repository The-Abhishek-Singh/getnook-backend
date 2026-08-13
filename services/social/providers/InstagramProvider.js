const BaseProvider = require("./BaseProvider");
const { createPage } = require("../utils/browser");
const { parseMeta } = require("../utils/instagramParser");

class InstagramProvider extends BaseProvider {

    extractUsername(url) {
        const match = url.match(/instagram\.com\/([^/?#]+)/i);

        if (!match) {
            throw new Error("Invalid Instagram URL");
        }

        return match[1];
    }

//     async fetch(url) {
//         const username = this.extractUsername(url);
//         const { page, context } = await createPage();

// const graphQLPromise = page.waitForResponse(
//     async (response) => {
//         try {
//             const responseUrl = response.url();
//             const contentType =
//                 response.headers()["content-type"] || "";

//             if (
//                 response.status() !== 200 ||
//                 !contentType.includes("application/json")
//             ) {
//                 return false;
//             }

//             if (
//                 !responseUrl.includes("/graphql") &&
//                 !responseUrl.includes("/api/")
//             ) {
//                 return false;
//             }

//             const json = await response.json();

//             return !!json?.data?.user?.edge_owner_to_timeline_media?.edges;

//         } catch {
//             return false;
//         }
//     },
//     {
//         timeout: 10000,
//     }
// );

// try {

//     await page.goto(
//         `https://www.instagram.com/${username}/`,
//         {
//             waitUntil: "domcontentloaded",
//             timeout: 30000,
//         }
//     );

//     let graphResponse = null;

//     try {
//         const response = await graphQLPromise;
//         graphResponse = await response.json();
//     } catch (err) {
//         console.warn(
//     `⚠️ Failed to fetch Instagram timeline for @${username}: ${err.message}`
// );
//     }

//     const profile = await this.fetchProfile(page, url);

//     const items = await this.fetchContent(graphResponse);

//     return this.normalize(profile, items);

//    } finally {
//     await context.close();
//    }
// }


// async fetch(url) {
//     const username = this.extractUsername(url);
//     const { page, context } = await createPage();

//     let graphResponse = null;

//     const responseHandler = async (response) => {
//     try {
//         const responseUrl = response.url();

//         if (
//             response.status() !== 200 ||
//             (!responseUrl.includes("/graphql") &&
//              !responseUrl.includes("/api/"))
//         ) {
//             return;
//         }

//         const contentType =
//             response.headers()["content-type"] || "";

//         if (!contentType.includes("application/json")) {
//             return;
//         }

//         const json = await response.json();

//         console.log("📡 Instagram API Response:", responseUrl);

//         console.dir(json, { depth: 3 });

//         if (
//             json?.data?.user?.edge_owner_to_timeline_media?.edges
//         ) {
//             graphResponse = json;
//             console.log("✅ Instagram GraphQL response found");
//         }

//     } catch (err) {
//         // Ignore unrelated responses
//     }
// };

//     page.on("response", responseHandler);

//     try {
//         await page.goto(
//             `https://www.instagram.com/${username}/`,
//             {
//                 waitUntil: "domcontentloaded",
//                 timeout: 30000,
//             }
//         );

//         // Give Instagram time to load the posts API response
//         await page.waitForTimeout(5000);

//         const profile = await this.fetchProfile(page, url);

//         const items = await this.fetchContent(graphResponse);

//         return this.normalize(profile, items);

//     } finally {
//         page.off("response", responseHandler);
//         await context.close();
//     }
// }

// async fetchContent(graphResponse) {

//         if (
//             !graphResponse?.data?.user?.edge_owner_to_timeline_media?.edges
//         ) {
//             console.log("❌ No Instagram posts found");
//             return [];
//         }

//         const edges =
//             graphResponse.data.user.edge_owner_to_timeline_media.edges;

//         console.log(`✅ Found ${edges.length} Instagram posts`);

//         const items = edges.map(({ node }) => {
//         const originalImage =
//         node.display_url ||
//         node.thumbnail_src ||
//         "";

//     return {
//         // id: node.id,

//         shortcode: node.shortcode,

//         url: `https://www.instagram.com/p/${node.shortcode}/`,

//         thumbnail: `${process.env.API_URL}/api/social/image?url=${encodeURIComponent(originalImage)}`,

//         // caption:
//         //     node.edge_media_to_caption?.edges?.[0]?.node?.text || "",

//         // likes:
//         //     node.edge_liked_by?.count ??
//         //     node.edge_media_preview_like?.count ??
//         //     0,

//         // comments:
//         //     node.edge_media_to_comment?.count ?? 0,

//         timestamp: new Date(node.taken_at_timestamp * 1000),

//         // type: node.__typename,

//         // isVideo: node.is_video,
//     };
// });

//         console.log("📦 Instagram Items:");
//         console.dir(items, { depth: null });

//         return items;
//     }


async fetch(url) {
    const username = this.extractUsername(url);
    const { page, context } = await createPage();

    try {
        await page.goto(
            `https://www.instagram.com/${username}/`,
            { waitUntil: "domcontentloaded", timeout: 30000 }
        );

        await page.waitForTimeout(5000);

        console.log("📍 Landed on:", page.url());
        console.log("📍 Page title:", await page.title());

        // Capture EVERYTHING that looks like a post/reel link, plus surrounding structure
        const diagnostic = await page.evaluate(() => {
            const allLinks = [...document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]')];

            return {
                totalLinks: allLinks.length,
                sample: allLinks.slice(0, 5).map(a => ({
                    href: a.getAttribute("href"),
                    outerHTML: a.outerHTML.slice(0, 400), // see real structure/classes
                    hasImg: !!a.querySelector("img"),
                    imgSrc: a.querySelector("img")?.src || null,
                })),
            };
        });

        console.log("🔍 Diagnostic:", JSON.stringify(diagnostic, null, 2));

        const profile = await this.fetchProfile(page, url);
        const items = await this.fetchContent(page);

        return this.normalize(profile, items);

    } finally {
        await context.close();
    }
}

async fetchContent(page) {
    const items = await page.evaluate(() => {
        const anchors = [...document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]')];

        return anchors.map(a => {
            const href = a.getAttribute("href") || "";
            const isReel = href.includes("/reel/");
            const shortcode = href.split(isReel ? "/reel/" : "/p/")[1]?.replace(/\/$/, "") || "";
            const img = a.querySelector("img");

            return {
                shortcode,
                thumbnail: img?.src || "",
                alt: img?.alt || "",
            };
        }).filter(item => item.shortcode);
    });

    console.log(`📸 Raw matches found: ${items.length}`);

    const seen = new Set();
    const deduped = items.filter(item => {
        if (seen.has(item.shortcode)) return false;
        seen.add(item.shortcode);
        return true;
    });

    const normalized = deduped.map(item => {
        const dateMatch = item.alt.match(/on (\w+ \d{1,2}, \d{4})/);
        const timestamp = dateMatch ? new Date(dateMatch[1]) : new Date();

        return {
            shortcode: item.shortcode,

            url: `https://www.instagram.com/p/${item.shortcode}/`,

            thumbnail: item.thumbnail
                ? `${process.env.API_URL}/api/social/image?url=${encodeURIComponent(item.thumbnail)}`
                : "",

            timestamp,
        };
    });

    console.log(`✅ Found ${normalized.length} Instagram posts (deduped)`);
    console.dir(normalized, { depth: null });

    return normalized;
}

async fetchProfile(page, url) {
        const username = this.extractUsername(url);

        const meta = await parseMeta(page);

        console.log("📦 Instagram Items:");
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

    normalize(profile, items) {
        return {
            platform: "instagram",
            fetchedAt: new Date(),
            profile,
            items,
        };
    }
}

module.exports = new InstagramProvider();