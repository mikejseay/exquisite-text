import { describe, it } from "node:test";
import assert from "node:assert/strict";

import app from "app";

describe("Express app", () => {
    it("exports a function (express app)", () => {
        assert.equal(typeof app, "function");
    });

    it("responds to catch-all route with a function handler", () => {
        // Verify the catch-all route exists
        const catchAll = app._router?.stack?.find(
            (layer: any) => layer.route?.path === "*",
        );
        assert.ok(catchAll, "Expected catch-all route to be registered");
    });
});
