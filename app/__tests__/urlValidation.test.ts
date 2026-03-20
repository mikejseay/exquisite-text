import { allowedHosts, allowedOrigin, getIsAllowedUrl } from "utils/urlValidation";

describe("getIsAllowedUrl", () => {
    it("allows https://www.exquisitetext.com", () => {
        expect(getIsAllowedUrl("https://www.exquisitetext.com")).toBe(true);
    });

    it("allows https://exquisitetext.com", () => {
        expect(getIsAllowedUrl("https://exquisitetext.com")).toBe(true);
    });

    it("allows https with path", () => {
        expect(getIsAllowedUrl("https://www.exquisitetext.com/room/ABCD")).toBe(true);
    });

    it("allows about:blank", () => {
        expect(getIsAllowedUrl("about:blank")).toBe(true);
    });

    it("rejects empty string", () => {
        expect(getIsAllowedUrl("")).toBe(false);
    });

    it("rejects http (non-https)", () => {
        expect(getIsAllowedUrl("http://www.exquisitetext.com")).toBe(false);
    });

    it("rejects other https domains", () => {
        expect(getIsAllowedUrl("https://evil.com")).toBe(false);
    });

    it("rejects subdomains that aren't www", () => {
        expect(getIsAllowedUrl("https://api.exquisitetext.com")).toBe(false);
    });

    it("rejects javascript: protocol", () => {
        expect(getIsAllowedUrl("javascript:alert(1)")).toBe(false);
    });

    it("rejects data: URIs", () => {
        expect(getIsAllowedUrl("data:text/html,<h1>test</h1>")).toBe(false);
    });

    it("rejects malformed URLs gracefully", () => {
        expect(getIsAllowedUrl("not a url at all")).toBe(false);
    });

    it("rejects ftp protocol", () => {
        expect(getIsAllowedUrl("ftp://exquisitetext.com")).toBe(false);
    });

    it("allows URLs with query parameters", () => {
        expect(getIsAllowedUrl("https://www.exquisitetext.com?page=1")).toBe(true);
    });

    it("allows URLs with hash fragments", () => {
        expect(getIsAllowedUrl("https://exquisitetext.com#section")).toBe(true);
    });
});

describe("constants", () => {
    it("allowedHosts contains expected hosts", () => {
        expect(allowedHosts.has("exquisitetext.com")).toBe(true);
        expect(allowedHosts.has("www.exquisitetext.com")).toBe(true);
        expect(allowedHosts.size).toBe(2);
    });

    it("allowedOrigin is the www https URL", () => {
        expect(allowedOrigin).toBe("https://www.exquisitetext.com");
    });
});
