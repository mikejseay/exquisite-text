import assert from "node:assert/strict";
import { describe, it } from "node:test";

import app from "app";

describe("Express app", () => {
    it("exports a function (express app)", () => {
        assert.equal(typeof app, "function");
    });

    it("has standard express methods", () => {
        assert.equal(typeof app.get, "function");
        assert.equal(typeof app.use, "function");
        assert.equal(typeof app.listen, "function");
    });
});
