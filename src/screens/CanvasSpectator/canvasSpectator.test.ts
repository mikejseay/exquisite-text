import { combineDrawingPanels } from "./index";
import type { Point } from "../../types";
import {
    DRAWING_ASPECT_RATIO,
    DRAWING_HEIGHT_MIN,
    DRAWING_WIDTH_MIN,
    OVERLAP,
    PANEL_ASPECT_RATIO,
    PANEL_HEIGHT_MIN,
    PANEL_WIDTH_MIN,
} from "../Canvas";

const stroke1: Point[] = [ { x: 10, y: 20, lineWidth: 2, color: "#f00" } ];
const stroke2: Point[] = [ { x: 30, y: 40, lineWidth: 3, color: "#0f0" } ];
const stroke3: Point[] = [ { x: 50, y: 60, lineWidth: 1, color: "#00f" } ];

describe("combineDrawingPanels", () => {
    it("returns empty array when nDrawings is 0", () => {
        const result = combineDrawingPanels([ [] ], [ [] ], 0);
        expect(result).toEqual([]);
    });

    it("combines completed panels only (no edits)", () => {
        const panels = [ [ [ stroke1 ], [ stroke2 ] ] ]; // 1 drawing, 2 panels
        const panelEdits = [ [] as Point[][] ];
        const result = combineDrawingPanels(panels, panelEdits, 1);

        expect(result).toHaveLength(1);
        expect(result[0]).toHaveLength(2);
        expect(result[0][0]).toEqual([ stroke1 ]);
        expect(result[0][1]).toEqual([ stroke2 ]);
    });

    it("combines panel edits only (no completed panels)", () => {
        const panels = [ [] as Point[][][] ];
        const panelEdits = [ [ stroke1, stroke2 ] ]; // 1 drawing, in-progress edit with 2 strokes
        const result = combineDrawingPanels(panels, panelEdits, 1);

        expect(result).toHaveLength(1);
        expect(result[0]).toHaveLength(1); // the edit becomes one panel
        expect(result[0][0]).toEqual([ stroke1, stroke2 ]);
    });

    it("combines completed panels with in-progress edits", () => {
        const panels = [ [ [ stroke1 ] ] ]; // 1 completed panel
        const panelEdits = [ [ stroke2, stroke3 ] ]; // current in-progress panel
        const result = combineDrawingPanels(panels, panelEdits, 1);

        expect(result).toHaveLength(1);
        expect(result[0]).toHaveLength(2); // 1 completed + 1 in-progress
        expect(result[0][0]).toEqual([ stroke1 ]); // completed panel
        expect(result[0][1]).toEqual([ stroke2, stroke3 ]); // in-progress edit
    });

    it("handles multiple drawings independently", () => {
        const panels = [
            [ [ stroke1 ] ],       // drawing 0: 1 completed panel
            [ [ stroke2 ], [ stroke3 ] ], // drawing 1: 2 completed panels
        ];
        const panelEdits = [
            [ stroke3 ],           // drawing 0: in-progress edit
            [] as Point[][],       // drawing 1: no current edit
        ];
        const result = combineDrawingPanels(panels, panelEdits, 2);

        expect(result).toHaveLength(2);
        // Drawing 0: completed + edit
        expect(result[0]).toHaveLength(2);
        expect(result[0][0]).toEqual([ stroke1 ]);
        expect(result[0][1]).toEqual([ stroke3 ]);
        // Drawing 1: only completed
        expect(result[1]).toHaveLength(2);
        expect(result[1][0]).toEqual([ stroke2 ]);
        expect(result[1][1]).toEqual([ stroke3 ]);
    });

    it("handles null panels gracefully", () => {
        const panelEdits = [ [ stroke1 ] ];
        const result = combineDrawingPanels(null, panelEdits, 1);

        expect(result).toHaveLength(1);
        expect(result[0]).toHaveLength(1);
        expect(result[0][0]).toEqual([ stroke1 ]);
    });

    it("handles null panelEdits gracefully", () => {
        const panels = [ [ [ stroke1 ] ] ];
        const result = combineDrawingPanels(panels, null, 1);

        expect(result).toHaveLength(1);
        expect(result[0]).toHaveLength(1);
    });

    it("handles both null gracefully", () => {
        const result = combineDrawingPanels(null, null, 2);
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual([]);
        expect(result[1]).toEqual([]);
    });

    it("skips empty panelEdits (no strokes yet)", () => {
        const panels = [ [ [ stroke1 ] ] ];
        const panelEdits = [ [] as Point[][] ]; // empty edit (no strokes)
        const result = combineDrawingPanels(panels, panelEdits, 1);

        // Should only have the completed panel, not an empty in-progress one
        expect(result[0]).toHaveLength(1);
    });

    it("preserves all strokes within panels without mutation", () => {
        const panel: Point[][] = [ stroke1, stroke2 ];
        const panels = [ [ panel ] ];
        const panelEdits = [ [] as Point[][] ];

        const result = combineDrawingPanels(panels, panelEdits, 1);

        // Verify content matches
        expect(result[0][0]).toEqual(panel);
        // Verify original not mutated (panels array still intact)
        expect(panels[0][0]).toEqual(panel);
    });
});

describe("Spectator canvas uses same dimensions as end screen", () => {
    // Both CompletedDrawing (used by CanvasSpectator and End screen)
    // use DRAWING_WIDTH_MIN, DRAWING_HEIGHT_MIN, DRAWING_ASPECT_RATIO.
    // These tests ensure the spectator and end screen scale identically.

    it("drawing dimensions account for 3 panels stacked with overlap", () => {
        // 3 panels, overlapping at 2 joints by OVERLAP fraction
        const expectedHeight = (3 - 2 * OVERLAP) * PANEL_HEIGHT_MIN;
        expect(DRAWING_HEIGHT_MIN).toBe(expectedHeight);
        expect(DRAWING_HEIGHT_MIN).toBe(780);
    });

    it("drawing width equals panel width", () => {
        expect(DRAWING_WIDTH_MIN).toBe(PANEL_WIDTH_MIN);
    });

    it("drawing aspect ratio is portrait-ish (< 1)", () => {
        expect(DRAWING_ASPECT_RATIO).toBeLessThan(1);
        expect(DRAWING_ASPECT_RATIO).toBeCloseTo(DRAWING_WIDTH_MIN / DRAWING_HEIGHT_MIN);
    });

    it("panel aspect ratio is landscape (> 1)", () => {
        expect(PANEL_ASPECT_RATIO).toBeGreaterThan(1);
    });

    function computeDrawingDimensions(viewportWidth: number, viewportHeight: number) {
        const viewportAspectRatio = viewportWidth / viewportHeight;
        let newWidth: number;
        let newHeight: number;

        if (viewportAspectRatio < DRAWING_ASPECT_RATIO) {
            newWidth = Math.max(viewportWidth, DRAWING_WIDTH_MIN);
            newHeight = Math.max(newWidth / DRAWING_ASPECT_RATIO, DRAWING_HEIGHT_MIN);
        } else {
            newHeight = Math.max(viewportHeight, DRAWING_HEIGHT_MIN);
            newWidth = Math.max(newHeight * DRAWING_ASPECT_RATIO, DRAWING_WIDTH_MIN);
        }

        const scaleFactor = newWidth / DRAWING_WIDTH_MIN;
        return { newWidth, newHeight, scaleFactor };
    }

    it("drawing canvas scaleFactor is always >= 1", () => {
        const viewports = [
            [ 100, 100 ],
            [ 375, 667 ],
            [ 667, 780 ],
            [ 1024, 768 ],
            [ 1920, 1080 ],
        ];
        for (const [ w, h ] of viewports) {
            const { scaleFactor } = computeDrawingDimensions(w, h);
            expect(scaleFactor).toBeGreaterThanOrEqual(1);
        }
    });

    it("at minimum dimensions, scaleFactor is 1", () => {
        const { scaleFactor } = computeDrawingDimensions(DRAWING_WIDTH_MIN, DRAWING_HEIGHT_MIN);
        expect(scaleFactor).toBe(1);
    });

    it("yOffset for each panel uses same OVERLAP and PANEL_HEIGHT_MIN", () => {
        // This is the formula used by CompletedDrawing in both spectator and end screen
        const scaleFactor = 1;
        const yOffset0 = 0;
        const yOffset1 = PANEL_HEIGHT_MIN * scaleFactor * (1 - OVERLAP);
        const yOffset2 = 2 * PANEL_HEIGHT_MIN * scaleFactor * (1 - OVERLAP);

        expect(yOffset0).toBe(0);
        expect(yOffset1).toBe(240); // 300 * 1 * 0.8
        expect(yOffset2).toBe(480); // 2 * 300 * 1 * 0.8
    });

    it("yOffset scales proportionally with scaleFactor", () => {
        const scaleFactor = 2;
        const yOffset1 = PANEL_HEIGHT_MIN * scaleFactor * (1 - OVERLAP);
        const yOffset2 = 2 * PANEL_HEIGHT_MIN * scaleFactor * (1 - OVERLAP);

        expect(yOffset1).toBe(480); // 300 * 2 * 0.8
        expect(yOffset2).toBe(960); // 2 * 300 * 2 * 0.8
    });

    it("total drawing height from yOffsets + last panel fits within canvas", () => {
        const scaleFactor = 1;
        const lastPanelYOffset = 2 * PANEL_HEIGHT_MIN * scaleFactor * (1 - OVERLAP);
        const lastPanelBottom = lastPanelYOffset + PANEL_HEIGHT_MIN * scaleFactor;

        // (3 - 2 * OVERLAP) * PANEL_HEIGHT_MIN = DRAWING_HEIGHT_MIN
        expect(lastPanelBottom).toBe(DRAWING_HEIGHT_MIN);
    });
});
