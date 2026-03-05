import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { canBeFixedByShifting, delay, isAcceptableShape, processPoetryLines } from "../llm_utils/llm_funcs";

describe("isAcceptableShape", () => {
    // idealCharsOnLineOne = 40, idealCharsOnLineTwo = 20
    // acceptable range: lineOne 24-56, lineTwo 12-28

    it("accepts lines within the ideal range", () => {
        const lineOne = "A".repeat(40); // exactly ideal
        const lineTwo = "B".repeat(20); // exactly ideal
        assert.equal(isAcceptableShape(lineOne, lineTwo, 40, 20, false), true);
    });

    it("accepts lines at lower bounds (0.6x)", () => {
        const lineOne = "A".repeat(24); // 0.6 * 40
        const lineTwo = "B".repeat(12); // 0.6 * 20
        assert.equal(isAcceptableShape(lineOne, lineTwo, 40, 20, false), true);
    });

    it("rejects line one that is too short", () => {
        const lineOne = "A".repeat(23); // below 0.6 * 40 = 24
        const lineTwo = "B".repeat(20);
        assert.equal(isAcceptableShape(lineOne, lineTwo, 40, 20, false), false);
    });

    it("rejects line one that is too long", () => {
        const lineOne = "A".repeat(57); // above 1.4 * 40 = 56
        const lineTwo = "B".repeat(20);
        assert.equal(isAcceptableShape(lineOne, lineTwo, 40, 20, false), false);
    });

    it("rejects line two that is too short", () => {
        const lineOne = "A".repeat(40);
        const lineTwo = "B".repeat(11); // below 0.6 * 20 = 12
        assert.equal(isAcceptableShape(lineOne, lineTwo, 40, 20, false), false);
    });

    it("rejects line two that is too long (forceIncomplete=false)", () => {
        const lineOne = "A".repeat(40);
        const lineTwo = "B".repeat(29); // above 1.4 * 20 = 28
        assert.equal(isAcceptableShape(lineOne, lineTwo, 40, 20, false), false);
    });

    it("allows long line two when forceIncomplete=true", () => {
        const lineOne = "A".repeat(40);
        const lineTwo = "B".repeat(50); // would be too long normally
        assert.equal(isAcceptableShape(lineOne, lineTwo, 40, 20, true), true);
    });

    it("still rejects short line two when forceIncomplete=true", () => {
        const lineOne = "A".repeat(40);
        const lineTwo = "B".repeat(11); // below min
        assert.equal(isAcceptableShape(lineOne, lineTwo, 40, 20, true), false);
    });
});

describe("canBeFixedByShifting", () => {
    it("returns true when shape is bad and line two is longer than line one", () => {
        // lineOne is too short (below 0.6 * 40 = 24), lineTwo longer
        assert.equal(canBeFixedByShifting("short", "this is a much longer second line here", 40, 20), true);
    });

    it("returns false when shape is acceptable", () => {
        const lineOne = "A".repeat(40);
        const lineTwo = "B".repeat(20);
        assert.equal(canBeFixedByShifting(lineOne, lineTwo, 40, 20), false);
    });

    it("returns false when line two is shorter than line one (even if shape is bad)", () => {
        const lineOne = "A".repeat(60); // too long
        const lineTwo = "B".repeat(5);  // shorter AND too short
        assert.equal(canBeFixedByShifting(lineOne, lineTwo, 40, 20), false);
    });
});

describe("processPoetryLines", () => {
    it("shifts words from line two to line one until line one is ~2x line two", () => {
        const [ newOne, newTwo ] = processPoetryLines(
            "A quick brown fox",
            "jumps over the lazy dog who is lying in the sun",
        );
        // line one should have gotten longer, line two shorter
        assert.ok(newOne.length > "A quick brown fox".length);
        assert.ok(newTwo.length < "jumps over the lazy dog who is lying in the sun".length);
        // line one should be approximately 2x line two
        assert.ok(newOne.length >= newTwo.length);
    });

    it("does not lose any words during shifting", () => {
        const original = "A quick brown fox jumps over the lazy dog who is lying in the sun";
        const [ newOne, newTwo ] = processPoetryLines(
            "A quick brown fox",
            "jumps over the lazy dog who is lying in the sun",
        );
        const recombined = newTwo
            ? `${newOne} ${newTwo}`
            : newOne;
        assert.equal(recombined, original);
    });

    it("handles empty line one by absorbing words from line two", () => {
        const [ newOne, newTwo ] = processPoetryLines("", "hello world foo bar baz");
        assert.ok(newOne.length > 0);
    });

    it("handles single word in line two", () => {
        const [ newOne, newTwo ] = processPoetryLines("Short", "word");
        // Should shift "word" to line one since line one < 2 * line two
        assert.ok(newOne.includes("word") || newTwo === "word");
    });
});

describe("delay", () => {
    it("resolves after the specified time", async () => {
        const start = Date.now();
        await delay(50);
        const elapsed = Date.now() - start;
        assert.ok(elapsed >= 40, `Expected at least 40ms, got ${elapsed}ms`);
    });
});
