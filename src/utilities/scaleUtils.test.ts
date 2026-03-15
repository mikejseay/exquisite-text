import { ScaleDirection, scalePoints } from "./scaleUtils";
import type { Point } from "../types";

describe("scalePoints", () => {
    const samplePoints: Point[] = [
        { x: 100, y: 200, lineWidth: 4, color: "#ff0000" },
        { x: 50, y: 75, lineWidth: 2, color: "#00ff00" },
    ];

    it("scales TO_DISPLAY by multiplying coordinates and lineWidth", () => {
        const scaled = scalePoints(samplePoints, ScaleDirection.TO_DISPLAY, 2);
        expect(scaled[0]).toEqual({ x: 200, y: 400, lineWidth: 8, color: "#ff0000" });
        expect(scaled[1]).toEqual({ x: 100, y: 150, lineWidth: 4, color: "#00ff00" });
    });

    it("scales TO_UNIVERSAL by dividing coordinates and lineWidth", () => {
        const scaled = scalePoints(samplePoints, ScaleDirection.TO_UNIVERSAL, 2);
        expect(scaled[0]).toEqual({ x: 50, y: 100, lineWidth: 2, color: "#ff0000" });
        expect(scaled[1]).toEqual({ x: 25, y: 37.5, lineWidth: 1, color: "#00ff00" });
    });

    it("preserves colors unchanged", () => {
        const scaled = scalePoints(samplePoints, ScaleDirection.TO_DISPLAY, 3);
        expect(scaled[0].color).toBe("#ff0000");
        expect(scaled[1].color).toBe("#00ff00");
    });

    it("with scale factor 1 returns identical values", () => {
        const scaled = scalePoints(samplePoints, ScaleDirection.TO_DISPLAY, 1);
        expect(scaled).toEqual(samplePoints);
    });

    it("round-trips TO_UNIVERSAL then TO_DISPLAY", () => {
        const factor = 2.5;
        const universal = scalePoints(samplePoints, ScaleDirection.TO_UNIVERSAL, factor);
        const display = scalePoints(universal, ScaleDirection.TO_DISPLAY, factor);
        display.forEach((point, i) => {
            expect(point.x).toBeCloseTo(samplePoints[i].x, 10);
            expect(point.y).toBeCloseTo(samplePoints[i].y, 10);
            expect(point.lineWidth).toBeCloseTo(samplePoints[i].lineWidth, 10);
            expect(point.color).toBe(samplePoints[i].color);
        });
    });

    it("handles empty array", () => {
        const scaled = scalePoints([], ScaleDirection.TO_DISPLAY, 2);
        expect(scaled).toEqual([]);
    });

    it("handles fractional scale factors", () => {
        const points: Point[] = [ { x: 10, y: 20, lineWidth: 5, color: "#000" } ];
        const scaled = scalePoints(points, ScaleDirection.TO_DISPLAY, 0.5);
        expect(scaled[0]).toEqual({ x: 5, y: 10, lineWidth: 2.5, color: "#000" });
    });

    it("throws for unrecognized ScaleDirection", () => {
        expect(() => {
            scalePoints(samplePoints, "INVALID" as ScaleDirection, 2);
        }).toThrow("unrecognized ScaleDirection");
    });

    it("handles large scale factors correctly", () => {
        const points: Point[] = [ { x: 1, y: 1, lineWidth: 1, color: "red" } ];
        const scaled = scalePoints(points, ScaleDirection.TO_DISPLAY, 1000);
        expect(scaled[0].x).toBe(1000);
        expect(scaled[0].y).toBe(1000);
        expect(scaled[0].lineWidth).toBe(1000);
    });

    it("does not mutate the original array", () => {
        const original: Point[] = [ { x: 10, y: 20, lineWidth: 3, color: "#abc" } ];
        const originalCopy = JSON.parse(JSON.stringify(original));
        scalePoints(original, ScaleDirection.TO_DISPLAY, 5);
        expect(original).toEqual(originalCopy);
    });
});
