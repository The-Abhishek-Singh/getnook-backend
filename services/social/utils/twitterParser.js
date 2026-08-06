function parseMeta(page) {
    return page.evaluate(() => {

        const getMeta = (selector) =>
            document.querySelector(selector)?.content || "";

        const title =
            getMeta('meta[property="og:title"]');

        const description =
            getMeta('meta[property="og:description"]') ||
            getMeta('meta[name="description"]');

        const avatar =
            getMeta('meta[property="og:image"]');

        const displayName =
            title.split(" (@")[0].trim();

        let followers = "0";
        let following = "0";
        let posts = "0";

        document.querySelectorAll(
            '[itemtype="https://schema.org/InteractionCounter"]'
        ).forEach(counter => {

            const name =
                counter.querySelector('meta[itemprop="name"]')?.content;

            const count =
                counter.querySelector(
                    'meta[itemprop="userInteractionCount"]'
                )?.content;

            if (!name || !count) return;

            switch (name.toLowerCase()) {

                case "tweets":
                    posts = count;
                    break;

                case "following":
                    following = count;
                    break;

                case "follows":
                    followers = count;
                    break;
            }
        });

        return {
            title,
            displayName,
            description,
            avatar,
            followers,
            following,
            posts,
        };
    });
}

module.exports = { parseMeta };