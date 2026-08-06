const InstagramProvider = require("./providers/InstagramProvider");
const GithubProvider = require("./providers/GithubProvider");
const YoutubeProvider = require("./providers/YoutubeProvider");
const TwitterProvider = require("./providers/TwitterProvider");
const LinkedInProvider = require("./providers/LinkedInProvider")
const CommonProvider = require("./providers/CommonProvider");

function getProvider(platform) {
    switch (platform) {
        case "instagram":
            return InstagramProvider;

        case "github":
            return GithubProvider;

        case "youtube":
            return YoutubeProvider;

        case "twitter":
            return TwitterProvider;

        case "linkedin":
            return LinkedInProvider;
        
        default:
            return CommonProvider;


        // default:
        //     throw new Error(`Unsupported platform: ${platform}`);
    }
}

module.exports = getProvider;