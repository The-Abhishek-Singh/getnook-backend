const axios = require("axios");
const BaseProvider = require("./BaseProvider");
const cheerio = require("cheerio");

class GitHubProvider extends BaseProvider {

    extractUsername(url) {
        const match = url.match(/github\.com\/([^/?#]+)/i);

        if (!match) {
            throw new Error("Invalid GitHub URL");
        }

        return match[1];
    }

    async fetch(url) {
        const username = this.extractUsername(url);

        const headers = {
            Accept: "application/vnd.github+json",
            "User-Agent": "Nook",
        };

        if (process.env.GITHUB_TOKEN) {
            headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
        }

        try {

            const [profileRes, contributionRes] = await Promise.all([

                axios.get(
                    `https://api.github.com/users/${username}`,
                    { headers }
                ),

                axios.get(
                    `https://github.com/users/${username}/contributions`,
                    {
                        headers: {
                            "User-Agent": "Mozilla/5.0"
                        }
                    }
                )

            ]);

            const profile = this.fetchProfile(profileRes.data);

            const items = this.fetchContent(contributionRes.data);

            return this.normalize(profile, items);

        } catch (error) {

            if (error.response?.status === 404) {
                throw new Error("GitHub user not found");
            }

            throw new Error(
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch GitHub profile"
            );
        }
    }

    fetchProfile(user) {

        return {

            id: String(user.id),

            username: user.login,

            displayName: user.name || user.login,

            avatar: user.avatar_url,

            bio: user.bio || "",

            followers: user.followers,

            following: user.following,

            verified: false
        };
    }

// fetchContent(html) {
//     const $ = cheerio.load(html);

//     const items = [];

//     $(".ContributionCalendar-grid td.ContributionCalendar-day").each((_, el) => {
//         const date = $(el).attr("data-date");
//         if (!date) return;
//         const level = Number($(el).attr("data-level"));

//         const id = $(el).attr("id");
//         const tooltip = $(`tool-tip[for="${id}"]`).text();

//         const countMatch = tooltip.match(/(\d+)\s+contribution/);

//         items.push({
//             date,
//             count: countMatch ? Number(countMatch[1]) : 0,
//             level,
//         });
//     });

//     // Sort by date because cells are traversed row-by-row
//     items.sort((a, b) => new Date(a.date) - new Date(b.date));

//     const last55 = items.slice(-55);

//     console.log(`✅ Found ${last55.length} contribution days`);
//     console.log("Total cells:", items.length);

// console.log("First of last55:");
// console.log(last55.slice(0, 5));

// console.log("Last of last55:");
// console.log(last55.slice(-5));

//     return last55;
// }

fetchContent(html) {
    const $ = cheerio.load(html);

    const items = [];

    $(".ContributionCalendar-grid td.ContributionCalendar-day").each((_, el) => {
        const date = $(el).attr("data-date");
        if (!date) return;

        const level = Number($(el).attr("data-level"));

        const id = $(el).attr("id");
        const tooltip = $(`tool-tip[for="${id}"]`).text();

        const countMatch = tooltip.match(/(\d+)\s+contribution/);

        items.push({
            date,
            count: countMatch ? Number(countMatch[1]) : 0,
            level,
        });
    });

    // GitHub HTML is not always in chronological order
    items.sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`✅ Found ${items.length} contribution days`);

    return items;
}

    normalize(profile, items) {

        return {

            platform: "github",

            fetchedAt: new Date(),

            profile,

            items
        };
    }
}

module.exports = new GitHubProvider();