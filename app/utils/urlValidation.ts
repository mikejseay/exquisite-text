export const allowedHosts = new Set(["exquisitetext.com", "www.exquisitetext.com"]);
export const allowedOrigin = "https://www.exquisitetext.com";

export const getIsAllowedUrl = (url: string): boolean => {
    if (!url) {
        return false;
    }

    if (url === "about:blank") {
        return true;
    }

    try {
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol !== "https:") {
            return false;
        }

        return allowedHosts.has(parsedUrl.host);
    } catch {
        return false;
    }
};
