function loadModule() {
    return require("utils/urlValidation") as typeof import("utils/urlValidation");
}

describe("default (production) configuration", () => {
    let mod: ReturnType<typeof loadModule>;

    beforeAll(() => {
        delete process.env.EXPO_PUBLIC_SERVER_URL;
        jest.resetModules();
        mod = loadModule();
    });

    it("defaults allowedOrigin to https://www.exquisitetext.com", () => {
        expect(mod.allowedOrigin).toBe("https://www.exquisitetext.com");
    });

    it("allowedHosts contains both www and bare domain", () => {
        expect(mod.allowedHosts.has("exquisitetext.com")).toBe(true);
        expect(mod.allowedHosts.has("www.exquisitetext.com")).toBe(true);
        expect(mod.allowedHosts.size).toBe(2);
    });

    it("allows https://www.exquisitetext.com", () => {
        expect(mod.getIsAllowedUrl("https://www.exquisitetext.com")).toBe(true);
    });

    it("allows https://exquisitetext.com", () => {
        expect(mod.getIsAllowedUrl("https://exquisitetext.com")).toBe(true);
    });

    it("allows https with path", () => {
        expect(mod.getIsAllowedUrl("https://www.exquisitetext.com/room/ABCD")).toBe(true);
    });

    it("allows about:blank", () => {
        expect(mod.getIsAllowedUrl("about:blank")).toBe(true);
    });

    it("rejects empty string", () => {
        expect(mod.getIsAllowedUrl("")).toBe(false);
    });

    it("rejects http (non-https)", () => {
        expect(mod.getIsAllowedUrl("http://www.exquisitetext.com")).toBe(false);
    });

    it("rejects other https domains", () => {
        expect(mod.getIsAllowedUrl("https://evil.com")).toBe(false);
    });

    it("rejects subdomains that aren't www", () => {
        expect(mod.getIsAllowedUrl("https://api.exquisitetext.com")).toBe(false);
    });

    it("rejects javascript: protocol", () => {
        expect(mod.getIsAllowedUrl("javascript:alert(1)")).toBe(false);
    });

    it("rejects data: URIs", () => {
        expect(mod.getIsAllowedUrl("data:text/html,<h1>test</h1>")).toBe(false);
    });

    it("rejects malformed URLs gracefully", () => {
        expect(mod.getIsAllowedUrl("not a url at all")).toBe(false);
    });

    it("rejects ftp protocol", () => {
        expect(mod.getIsAllowedUrl("ftp://exquisitetext.com")).toBe(false);
    });

    it("allows URLs with query parameters", () => {
        expect(mod.getIsAllowedUrl("https://www.exquisitetext.com?page=1")).toBe(true);
    });

    it("allows URLs with hash fragments", () => {
        expect(mod.getIsAllowedUrl("https://exquisitetext.com#section")).toBe(true);
    });
});

describe("custom EXPO_PUBLIC_SERVER_URL (local dev)", () => {
    let mod: ReturnType<typeof loadModule>;

    beforeAll(() => {
        process.env.EXPO_PUBLIC_SERVER_URL = "http://localhost:8080";
        jest.resetModules();
        mod = loadModule();
    });

    afterAll(() => {
        delete process.env.EXPO_PUBLIC_SERVER_URL;
    });

    it("uses the custom origin", () => {
        expect(mod.allowedOrigin).toBe("http://localhost:8080");
    });

    it("allowedHosts contains localhost:8080", () => {
        expect(mod.allowedHosts.has("localhost:8080")).toBe(true);
    });

    it("allows http://localhost:8080", () => {
        expect(mod.getIsAllowedUrl("http://localhost:8080")).toBe(true);
    });

    it("allows http://localhost:8080 with path", () => {
        expect(mod.getIsAllowedUrl("http://localhost:8080/room/ABCD")).toBe(true);
    });

    it("rejects https://localhost:8080 (wrong protocol)", () => {
        expect(mod.getIsAllowedUrl("https://localhost:8080")).toBe(false);
    });

    it("rejects production domain when overridden", () => {
        expect(mod.getIsAllowedUrl("https://www.exquisitetext.com")).toBe(false);
    });
});

describe("invalid EXPO_PUBLIC_SERVER_URL falls back to production", () => {
    let mod: ReturnType<typeof loadModule>;

    beforeAll(() => {
        process.env.EXPO_PUBLIC_SERVER_URL = "not-a-valid-url";
        jest.resetModules();
        mod = loadModule();
    });

    afterAll(() => {
        delete process.env.EXPO_PUBLIC_SERVER_URL;
    });

    it("falls back to production origin", () => {
        expect(mod.allowedOrigin).toBe("https://www.exquisitetext.com");
    });

    it("falls back to production hosts", () => {
        expect(mod.allowedHosts.has("www.exquisitetext.com")).toBe(true);
        expect(mod.allowedHosts.has("exquisitetext.com")).toBe(true);
    });
});
