import {
    DRAWING_ASPECT_RATIO,
    DRAWING_HEIGHT_MIN,
    DRAWING_WIDTH_MIN,
    OVERLAP,
    PANEL_ASPECT_RATIO,
    PANEL_HEIGHT_MIN,
    PANEL_WIDTH_MIN,
} from "./index";

describe("Canvas constants", () => {
    it("PANEL_WIDTH_MIN is 667", () => {
        expect(PANEL_WIDTH_MIN).toBe(667);
    });

    it("PANEL_HEIGHT_MIN is 300", () => {
        expect(PANEL_HEIGHT_MIN).toBe(300);
    });

    it("OVERLAP is 0.2 (20%)", () => {
        expect(OVERLAP).toBe(0.2);
    });

    it("PANEL_ASPECT_RATIO equals width / height", () => {
        expect(PANEL_ASPECT_RATIO).toBeCloseTo(PANEL_WIDTH_MIN / PANEL_HEIGHT_MIN, 10);
    });

    it("PANEL_ASPECT_RATIO is landscape (> 1)", () => {
        expect(PANEL_ASPECT_RATIO).toBeGreaterThan(1);
    });
});

describe("Drawing composite dimensions", () => {
    it("DRAWING_HEIGHT_MIN accounts for 3 panels with overlap", () => {
        // 3 panels stacked, overlapping by OVERLAP on 2 joints
        // height = (3 - 2 * 0.2) * 300 = 2.6 * 300 = 780
        expect(DRAWING_HEIGHT_MIN).toBe((3 - 2 * OVERLAP) * PANEL_HEIGHT_MIN);
        expect(DRAWING_HEIGHT_MIN).toBe(780);
    });

    it("DRAWING_WIDTH_MIN equals PANEL_WIDTH_MIN", () => {
        expect(DRAWING_WIDTH_MIN).toBe(PANEL_WIDTH_MIN);
    });

    it("DRAWING_ASPECT_RATIO equals width / composite height", () => {
        expect(DRAWING_ASPECT_RATIO).toBeCloseTo(DRAWING_WIDTH_MIN / DRAWING_HEIGHT_MIN, 10);
    });

    it("DRAWING_ASPECT_RATIO is less than 1 (portrait-ish)", () => {
        // 667 / 780 ≈ 0.855
        expect(DRAWING_ASPECT_RATIO).toBeLessThan(1);
        expect(DRAWING_ASPECT_RATIO).toBeCloseTo(0.855, 2);
    });
});

describe("Canvas scaling logic", () => {
    // Test the resize logic extracted from Canvas component
    function computeCanvasDimensions(
        viewportWidth: number,
        viewportHeight: number,
    ) {
        const viewportAspectRatio = viewportWidth / viewportHeight;
        let newWidth: number;
        let newHeight: number;

        if (viewportAspectRatio < PANEL_ASPECT_RATIO) {
            newWidth = Math.max(viewportWidth, PANEL_WIDTH_MIN);
            newHeight = Math.max(newWidth / PANEL_ASPECT_RATIO, PANEL_HEIGHT_MIN);
        } else {
            newHeight = Math.max(viewportHeight, PANEL_HEIGHT_MIN);
            newWidth = Math.max(newHeight * PANEL_ASPECT_RATIO, PANEL_WIDTH_MIN);
        }

        const scaleFactor = newWidth / PANEL_WIDTH_MIN;
        return { newWidth, newHeight, scaleFactor };
    }

    it("on large landscape monitor (1920x1080), canvas fills height", () => {
        const { newWidth, newHeight, scaleFactor } = computeCanvasDimensions(1920, 1080);
        expect(newWidth).toBeGreaterThanOrEqual(PANEL_WIDTH_MIN);
        expect(newHeight).toBeGreaterThanOrEqual(PANEL_HEIGHT_MIN);
        expect(scaleFactor).toBeGreaterThanOrEqual(1);
    });

    it("on narrow portrait mobile (375x667), canvas uses min width", () => {
        const { newWidth, newHeight, scaleFactor } = computeCanvasDimensions(375, 667);
        expect(newWidth).toBe(PANEL_WIDTH_MIN);
        expect(newHeight).toBe(PANEL_HEIGHT_MIN);
        expect(scaleFactor).toBe(1);
    });

    it("on iPad landscape (1024x768), canvas scales up", () => {
        const { newWidth, newHeight, scaleFactor } = computeCanvasDimensions(1024, 768);
        expect(newWidth).toBeGreaterThan(PANEL_WIDTH_MIN);
        expect(scaleFactor).toBeGreaterThan(1);
        // Aspect ratio should be maintained
        expect(newWidth / newHeight).toBeCloseTo(PANEL_ASPECT_RATIO, 1);
    });

    it("on exactly minimum dimensions, scaleFactor is 1", () => {
        const { scaleFactor } = computeCanvasDimensions(PANEL_WIDTH_MIN, PANEL_HEIGHT_MIN);
        expect(scaleFactor).toBe(1);
    });

    it("scaleFactor is always >= 1 (never scales down)", () => {
        const viewports = [
            [ 100, 100 ],
            [ 300, 200 ],
            [ 667, 300 ],
            [ 1920, 1080 ],
            [ 2560, 1440 ],
        ];
        for (const [ w, h ] of viewports) {
            const { scaleFactor } = computeCanvasDimensions(w, h);
            expect(scaleFactor).toBeGreaterThanOrEqual(1);
        }
    });

    it("maintains panel aspect ratio", () => {
        const viewports = [
            [ 800, 400 ],
            [ 1200, 800 ],
            [ 1920, 1080 ],
        ];
        for (const [ w, h ] of viewports) {
            const { newWidth, newHeight } = computeCanvasDimensions(w, h);
            expect(newWidth / newHeight).toBeCloseTo(PANEL_ASPECT_RATIO, 1);
        }
    });
});
