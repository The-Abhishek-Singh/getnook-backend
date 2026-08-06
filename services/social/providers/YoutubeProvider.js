const axios = require("axios");
const BaseProvider = require("./BaseProvider");

class YouTubeProvider extends BaseProvider {

    extractHandle(url) {
        const match = url.match(/youtube\.com\/@([^/?#]+)/i);

        if (!match) {
            throw new Error("Invalid YouTube Handle URL");
        }

        return match[1];
    }

    async fetch(url) {
        console.log("Incoming URL:", url);
        const handle = this.extractHandle(url);

        console.log("Extracted Handle:", handle);

        const headers = {
            Accept: "application/json",
        };

        try {

            // Step 1 - Resolve handle -> Channel ID
            const searchResponse = await axios.get(
                "https://www.googleapis.com/youtube/v3/search",
                {
                    headers,
                    params: {
                        key: process.env.YOUTUBE_API_KEY,
                        q: handle,
                        type: "channel",
                        part: "snippet",
                        maxResults: 1,
                    },
                }
            );
            console.dir(searchResponse.data, { depth: null });
            console.log("API Key Loaded:", !!process.env.YOUTUBE_API_KEY);

            if (!searchResponse.data.items.length) {
                throw new Error("YouTube channel not found");
            }

            const channelId =
                searchResponse.data.items[0].snippet.channelId;

            // Step 2 - Fetch channel details
            const channelResponse = await axios.get(
                "https://www.googleapis.com/youtube/v3/channels",
                {
                    headers,
                    params: {
                        key: process.env.YOUTUBE_API_KEY,
                        id: channelId,
                        part: "snippet,statistics",
                    },
                }
            );

            if (!channelResponse.data.items.length) {
                throw new Error("Channel details not found");
            }

            const channel = channelResponse.data.items[0];

            const profile = this.fetchProfile(handle, channel);

        //     items: [
        //          {
        //           id,
        //           type: "video",
        //           title,
        //           thumbnail,
        //           publishedAt,
        //           duration,
        //           views,
        //           likes,
        //           comments,
        //           url
        //       },
        //        {
        //            id,
        //            type: "playlist",
        //            title,
        //            thumbnail,
        //            videos,
        //            url
        //        }
        //    ]
        const items = [];

            return this.normalize(profile, items);

        } catch (error) {

            throw new Error(
                error.response?.data?.error?.message ||
                error.message ||
                "Failed to fetch YouTube profile"
            );
        }
    }

    fetchProfile(handle, channel) {

        const snippet = channel.snippet;
        const stats = channel.statistics;

        console.log("YouTube Profile:");
        console.dir(channel, { depth: null });

        return {
            id: channel.id,

            username: handle,

            displayName: snippet.title,

            avatar: snippet.thumbnails?.high?.url ||
                    snippet.thumbnails?.default?.url,

            bio: snippet.description,

            followers: Number(stats.subscriberCount || 0),

            following: 0,

            verified: false,

            videos: Number(stats.videoCount || 0),
        };
    }

    normalize(profile, items) {

        return {
            platform: "youtube",

            fetchedAt: new Date(),

            profile,

            items,
        };
    }
}

module.exports = new YouTubeProvider();