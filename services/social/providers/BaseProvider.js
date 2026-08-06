class BaseProvider {
    async fetchProfile(page, url) {
        throw new Error("fetchProfile() not implemented");
    }

    async fetchContent(page, url) {
        throw new Error("fetchContent() not implemented");
    }

    normalize(profile, items) {
        throw new Error("normalize() not implemented");
    }

    async fetch(url) {
        throw new Error("fetch() not implemented");
    }
}

module.exports = BaseProvider;