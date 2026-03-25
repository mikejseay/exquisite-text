const DEFAULT_ORIGIN = "https://www.exquisitetext.com";

function parseOrigin(url: string): URL {
    try {
        return new URL(url);
    } catch {
        return new URL(DEFAULT_ORIGIN);
    }
}

const parsed = parseOrigin(process.env.EXPO_PUBLIC_SERVER_URL ?? DEFAULT_ORIGIN);

export const allowedHosts = new Set([parsed.host, parsed.host.replace(/^www\./, "")]);
export const allowedOrigin = parsed.origin;

export const getIsAllowedUrl = (url: string): boolean => {
    if (!url) {
        return false;
    }

    if (url === "about:blank") {
        return true;
    }

    try {
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol !== parsed.protocol) {
            return false;
        }

        return allowedHosts.has(parsedUrl.host);
    } catch {
        return false;
    }
};
