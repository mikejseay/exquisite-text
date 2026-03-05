import { describe, it } from "node:test";
import assert from "node:assert/strict";

import app from "../app";

describe("Express app", () => {
    it("exports a function (express app)", () => {
        assert.equal(typeof app, "function");
    });

    it("has /poems route registered", () => {
        // Express stores routes in the app._router.stack
        const routes = app._router?.stack
            ?.filter((layer: any) => layer.name === "router")
            ?.map((layer: any) => layer.regexp?.source);

        // The poems router should be mounted
        assert.ok(
            routes?.some((r: string) => r.includes("poems")),
            "Expected /poems route to be registered",
        );
    });

    it("responds to catch-all route with a function handler", () => {
        // Verify the catch-all route exists
        const catchAll = app._router?.stack?.find(
            (layer: any) => layer.route?.path === "*",
        );
        assert.ok(catchAll, "Expected catch-all route to be registered");
    });
});
