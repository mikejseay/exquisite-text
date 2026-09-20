import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderPanelPng } from "modules/drawing_render";
import type { Point } from "shared/types/types";

function pt(x: number, y: number, color = "#7F7F7F", lineWidth = 3): Point {
    return { x, y, lineWidth, color };
}

describe("renderPanelPng: rasterizing a panel to PNG", () => {
    it("returns a PNG at the expected pixel size for the default scale", () => {
        const png = renderPanelPng([], []);
        assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        assert.equal(png.readUInt32BE(16), 1334); // 667 * 2
        assert.equal(png.readUInt32BE(20), 600); // 300 * 2
    });

    it("paints something different when there are strokes", () => {
        const empty = renderPanelPng([], []);
        const withStrokes = renderPanelPng([], [[pt(50, 50), pt(600, 250)]]);
        assert.notDeepEqual(withStrokes, empty);
    });
});
