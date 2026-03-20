import "@testing-library/jest-dom";
import { randomUUID } from "node:crypto";

// Polyfill crypto.randomUUID for JSDOM test environment
if (typeof globalThis.crypto?.randomUUID !== "function") {
    Object.defineProperty(globalThis, "crypto", {
        value: { ...globalThis.crypto, randomUUID },
    });
}

// Mock window.matchMedia (not available in JSDOM)
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }),
});
