const BaseProvider = require("./BaseProvider");

class LinkedInProvider extends BaseProvider {

    extractUsername(url) {
        const match = url.match(
            /linkedin\.com\/in\/([^/?#]+)/i
        );

        if (!match) {
            throw new Error("Invalid LinkedIn profile URL");
        }

        return match[1];
    }

    async fetch(url) {
        const username = this.extractUsername(url);

        return {
            platform: "linkedin",

            fetchedAt: new Date(),

            profile: {
                username,
                displayName: username,
                avatar: "",
                verified: false
            },

            items: []
        };
    }
}

module.exports = new LinkedInProvider();