function parseMeta(page) {
    return page.evaluate(() => {

        const getMeta = (selector) =>
            document.querySelector(selector)?.content || "";

        const title = getMeta('meta[property="og:title"]');

        const description =
            getMeta('meta[property="og:description"]') ||
            getMeta('meta[name="description"]');

        const avatar =
            getMeta('meta[property="og:image"]');

        const match =
            description.match(
                /([\d.,KM]+)\sFollowers,\s([\d.,KM]+)\sFollowing,\s([\d.,KM]+)\sPosts/i
            );

        const displayName =title.split("(@")[0].trim();

        return {
        title,
        displayName,
        description,
        avatar,
        followers: match?.[1] || "0",
        following: match?.[2] || "0",
        posts: match?.[3] || "0",
    };
    });
}

module.exports = { parseMeta };