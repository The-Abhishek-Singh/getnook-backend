const PLATFORM_PATTERNS = {
    instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com/i,
    twitter: /(?:https?:\/\/)?(?:www\.)?(twitter|x)\.com/i,
    github: /(?:https?:\/\/)?(?:www\.)?github\.com/i,
    youtube: /(?:https?:\/\/)?(?:www\.)?(youtube\.com|youtu\.be)/i,
    spotify: /(?:https?:\/\/)?open\.spotify\.com/i,
    linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com/i,
    facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com/i,
    threads: /(?:https?:\/\/)?(?:www\.)?threads\.net/i,
    tiktok: /(?:https?:\/\/)?(?:www\.)?tiktok\.com/i
};

function detectPlatform(url) {
    if (!url) return null;

    for (const [platform, regex] of Object.entries(PLATFORM_PATTERNS)) {
        if (regex.test(url)) {
            return platform;
        }
    }

    return "website";
}

module.exports = detectPlatform;