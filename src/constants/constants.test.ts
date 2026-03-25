import {
    checkActivityInterval,
    defaultGameSettings,
    editorColorDefaultsArr,
    lineConstraints,
    lineSepString,
    maxEditors,
    maxMemberTimeSpentInactive,
    maxNameChars,
    maxRoomTimeSpentEmpty,
    roomCodeLength,
} from "constants/constants";
import { LineLength } from "types/types";

describe("lineConstraints", () => {
    it("has short and long presets", () => {
        expect(lineConstraints).toHaveProperty("short");
        expect(lineConstraints).toHaveProperty("long");
    });

    for (const preset of ["short", "long"] as LineLength[]) {
        describe(`${preset} preset`, () => {
            const c = lineConstraints[preset];

            it("has all required fields", () => {
                expect(c).toHaveProperty("minCharsOnLineOne");
                expect(c).toHaveProperty("maxCharsOnLineOne");
                expect(c).toHaveProperty("minCharsOnLineTwo");
                expect(c).toHaveProperty("maxCharsOnLineTwo");
                expect(c).toHaveProperty("idealCharsOnLineOne");
                expect(c).toHaveProperty("idealCharsOnLineTwo");
                expect(c).toHaveProperty("idealWordsOnLineOne");
                expect(c).toHaveProperty("idealWordsOnLineTwo");
            });

            it("min <= ideal <= max for line one chars", () => {
                expect(c.minCharsOnLineOne).toBeLessThanOrEqual(c.idealCharsOnLineOne);
                expect(c.idealCharsOnLineOne).toBeLessThanOrEqual(c.maxCharsOnLineOne);
            });

            it("min <= ideal <= max for line two chars", () => {
                expect(c.minCharsOnLineTwo).toBeLessThanOrEqual(c.idealCharsOnLineTwo);
                expect(c.idealCharsOnLineTwo).toBeLessThanOrEqual(c.maxCharsOnLineTwo);
            });

            it("line one ideal is approximately 2x line two ideal", () => {
                const ratio = c.idealCharsOnLineOne / c.idealCharsOnLineTwo;
                expect(ratio).toBeCloseTo(2, 0);
            });

            it("ideal words are positive integers", () => {
                expect(c.idealWordsOnLineOne).toBeGreaterThan(0);
                expect(c.idealWordsOnLineTwo).toBeGreaterThan(0);
                expect(Number.isInteger(c.idealWordsOnLineOne)).toBe(true);
                expect(Number.isInteger(c.idealWordsOnLineTwo)).toBe(true);
            });
        });
    }

    it("long preset has larger limits than short", () => {
        expect(lineConstraints.long.idealCharsOnLineOne).toBeGreaterThan(lineConstraints.short.idealCharsOnLineOne);
        expect(lineConstraints.long.idealCharsOnLineTwo).toBeGreaterThan(lineConstraints.short.idealCharsOnLineTwo);
    });
});

describe("game constants", () => {
    it("roomCodeLength is 4", () => {
        expect(roomCodeLength).toBe(4);
    });

    it("maxNameChars is 13", () => {
        expect(maxNameChars).toBe(13);
    });

    it("maxEditors is 4", () => {
        expect(maxEditors).toBe(4);
    });

    it("editorColorDefaultsArr has maxEditors entries", () => {
        expect(editorColorDefaultsArr).toHaveLength(maxEditors);
    });

    it("editor colors are valid hex colors", () => {
        for (const color of editorColorDefaultsArr) {
            expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        }
    });

    it("lineSepString is newline", () => {
        expect(lineSepString).toBe("\n");
    });
});

describe("defaultGameSettings", () => {
    it("has correct shape", () => {
        expect(defaultGameSettings).toHaveProperty("lineLength");
        expect(defaultGameSettings).toHaveProperty("nRounds");
        expect(defaultGameSettings).toHaveProperty("nPoems");
        expect(defaultGameSettings).toHaveProperty("nDrawings");
    });

    it("lineLength defaults to SHORT", () => {
        expect(defaultGameSettings.lineLength).toBe(LineLength.SHORT);
    });

    it("has at least 1 poem and 1 drawing", () => {
        expect(defaultGameSettings.nPoems).toBeGreaterThanOrEqual(1);
        expect(defaultGameSettings.nDrawings).toBeGreaterThanOrEqual(1);
    });

    it("has at least 1 round", () => {
        expect(defaultGameSettings.nRounds).toBeGreaterThanOrEqual(1);
    });
});

describe("timing constants", () => {
    it("maxMemberTimeSpentInactive is 5 minutes", () => {
        expect(maxMemberTimeSpentInactive).toBe(300_000);
    });

    it("maxRoomTimeSpentEmpty is 10 minutes", () => {
        expect(maxRoomTimeSpentEmpty).toBe(600_000);
    });

    it("checkActivityInterval is 30 seconds", () => {
        expect(checkActivityInterval).toBe(30_000);
    });

    it("check interval is less than inactive threshold", () => {
        expect(checkActivityInterval).toBeLessThan(maxMemberTimeSpentInactive);
    });
});
