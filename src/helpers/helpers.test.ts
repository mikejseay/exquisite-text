import { alphaCharacterRotate, generateAlphaString, getItemsOnCurrentPage, sleep } from "helpers/helpers";
import type { IPoem } from "types/types";

describe("generateAlphaString", () => {
    it("returns a string of the requested length", () => {
        expect(generateAlphaString(4)).toHaveLength(4);
        expect(generateAlphaString(10)).toHaveLength(10);
        expect(generateAlphaString(0)).toHaveLength(0);
    });

    it("returns only uppercase alpha characters", () => {
        const result = generateAlphaString(100);
        expect(result).toMatch(/^[A-Z]*$/);
    });

    it("produces different strings on subsequent calls (probabilistic)", () => {
        const results = new Set(Array.from({ length: 20 }, () => generateAlphaString(8)));
        // With 8 chars from 26 letters, extremely unlikely to get all duplicates
        expect(results.size).toBeGreaterThan(1);
    });
});

describe("alphaCharacterRotate", () => {
    it("returns a string of the same length", () => {
        const input = "hello";
        const result = alphaCharacterRotate(input);
        expect(result).toHaveLength(input.length);
    });

    it("preserves non-alpha characters", () => {
        const input = "123!@#";
        const result = alphaCharacterRotate(input);
        expect(result).toBe(input);
    });

    it("replaces lowercase alpha characters with other lowercase alpha", () => {
        // Run many times to verify output chars are always lowercase alpha
        for (let i = 0; i < 50; i++) {
            const result = alphaCharacterRotate("abcde");
            expect(result).toMatch(/^[a-z]{5}$/);
        }
    });

    it("preserves uppercase characters (they are not in the allPossibleLetters set)", () => {
        const result = alphaCharacterRotate("HELLO");
        expect(result).toBe("HELLO");
    });

    it("handles empty string", () => {
        expect(alphaCharacterRotate("")).toBe("");
    });

    it("handles mixed alpha and non-alpha", () => {
        const result = alphaCharacterRotate("a1b2c3");
        expect(result[1]).toBe("1");
        expect(result[3]).toBe("2");
        expect(result[5]).toBe("3");
        expect(result[0]).toMatch(/[a-z]/);
        expect(result[2]).toMatch(/[a-z]/);
        expect(result[4]).toMatch(/[a-z]/);
    });
});

describe("getItemsOnCurrentPage", () => {
    const makePoems = (n: number): IPoem[] =>
        Array.from({ length: n }, (_, i) => ({
            id: `${i}`,
            content: `Poem ${i}`,
            title: `Title ${i}`,
            createdAt: new Date(),
        }));

    it("returns correct items for page 1", () => {
        const poems = makePoems(25);
        const result = getItemsOnCurrentPage(poems, 1, 10);
        expect(result).toHaveLength(10);
        expect(result[0].id).toBe("0");
        expect(result[9].id).toBe("9");
    });

    it("returns correct items for page 2", () => {
        const poems = makePoems(25);
        const result = getItemsOnCurrentPage(poems, 2, 10);
        expect(result).toHaveLength(10);
        expect(result[0].id).toBe("10");
        expect(result[9].id).toBe("19");
    });

    it("returns only remaining items on last partial page", () => {
        const poems = makePoems(25);
        const result = getItemsOnCurrentPage(poems, 3, 10);
        expect(result).toHaveLength(5);
        expect(result[0].id).toBe("20");
        expect(result[4].id).toBe("24");
    });

    it("returns empty array when page exceeds items", () => {
        const poems = makePoems(5);
        const result = getItemsOnCurrentPage(poems, 2, 10);
        expect(result).toHaveLength(0);
    });

    it("returns all items when itemsPerPage exceeds total", () => {
        const poems = makePoems(3);
        const result = getItemsOnCurrentPage(poems, 1, 10);
        expect(result).toHaveLength(3);
    });

    it("returns empty array for empty input", () => {
        const result = getItemsOnCurrentPage([], 1, 10);
        expect(result).toHaveLength(0);
    });
});

describe("sleep", () => {
    it("resolves after specified milliseconds", async () => {
        const start = Date.now();
        await sleep(50);
        expect(Date.now() - start).toBeGreaterThanOrEqual(40);
    });
});
