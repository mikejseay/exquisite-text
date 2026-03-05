// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Polyfill setImmediate for socket.io-client's xmlhttprequest-ssl dependency
// (removed from newer Node.js but still used by the library)
if (typeof globalThis.setImmediate === "undefined") {
    (globalThis as any).setImmediate = (fn: (...args: any[]) => void, ...args: any[]) =>
        setTimeout(fn, 0, ...args);
}

// Mock window.matchMedia (not available in JSDOM)
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    }),
});
