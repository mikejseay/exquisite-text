import { DEFAULT_COLOR, setCanvasDimensions, setCanvasProperties } from "utilities/canvasUtils";

// Mock pixelRatio since window.devicePixelRatio may not be set in test env
jest.mock("./scaleUtils", () => ({
    pixelRatio: 2,
}));

describe("DEFAULT_COLOR", () => {
    it("is a valid hex color string", () => {
        expect(DEFAULT_COLOR).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
});

describe("setCanvasDimensions", () => {
    it("sets canvas style and actual dimensions using pixelRatio", () => {
        const canvas = {
            style: { width: "", height: "" },
            width: 0,
            height: 0,
        } as unknown as HTMLCanvasElement;

        setCanvasDimensions(canvas, 800, 600);

        expect(canvas.style.width).toBe("800px");
        expect(canvas.style.height).toBe("600px");
        // pixelRatio is mocked to 2
        expect(canvas.width).toBe(1600);
        expect(canvas.height).toBe(1200);
    });

    it("handles null canvas without throwing", () => {
        expect(() => setCanvasDimensions(null, 100, 100)).not.toThrow();
    });

    it("handles small dimensions", () => {
        const canvas = {
            style: { width: "", height: "" },
            width: 0,
            height: 0,
        } as unknown as HTMLCanvasElement;

        setCanvasDimensions(canvas, 1, 1);
        expect(canvas.style.width).toBe("1px");
        expect(canvas.style.height).toBe("1px");
        expect(canvas.width).toBe(2);
        expect(canvas.height).toBe(2);
    });
});

describe("setCanvasProperties", () => {
    it("sets lineCap and lineJoin on context", () => {
        const context = {
            lineCap: "",
            lineJoin: "",
        } as unknown as CanvasRenderingContext2D;

        setCanvasProperties(context);

        expect(context.lineCap).toBe("round");
        expect(context.lineJoin).toBe("round");
    });
});
