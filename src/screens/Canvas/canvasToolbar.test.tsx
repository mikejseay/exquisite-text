import { createTheme, ThemeProvider } from "@mui/material/styles";
import { fireEvent, render, screen } from "@testing-library/react";

// Mock socket.io-client
vi.mock("socket.io-client", () => ({
    io: () => ({
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
    }),
}));

// Mock SocketInfoProvider to supply editorActive state
const mockSocketInfo = {
    strokeHistory: [] as any,
    editorActive: true,
    onLastContribution: false,
    poemInput: null,
    poemInputSpectate: null,
    joinErrorMessage: null,
    roomCode: null,
    setRoomCode: vi.fn(),
    settingsEnabled: null,
    userInfo: null,
    setEditorActive: vi.fn(),
    lineEdits: null,
    lineLength: null,
    lines: null,
    nPoems: null,
    nRounds: null,
    setPoemInput: vi.fn(),
    poemsLines: null,
    setLineLength: vi.fn(),
    setNPoems: vi.fn(),
    setNRounds: vi.fn(),
    panels: null,
    panelEdits: null,
    nDrawings: null,
    setNDrawings: vi.fn(),
    setStrokeHistory: vi.fn(),
    setCompletedDrawings: vi.fn(),
    completedDrawings: null,
    medium: null,
    setMedium: vi.fn(),
};

vi.mock("context/SocketInfoProvider", () => ({
    useSocketInfo: () => mockSocketInfo,
}));

vi.mock("context/SocketRequestors", () => ({
    emitSendPanel: vi.fn(),
    emitSendLastPanel: vi.fn(),
    emitSendPanelEdit: vi.fn(),
}));

vi.mock("utilities/canvasUtils", () => ({
    DEFAULT_COLOR: "#000000",
    drawOnCanvas: vi.fn(),
}));

vi.mock("utilities/scaleUtils", () => ({
    pixelRatio: 1,
    ScaleDirection: { TO_DISPLAY: "TO_DISPLAY", TO_UNIVERSAL: "TO_UNIVERSAL" },
    scalePoints: (pts: any) => pts,
}));

vi.mock("hooks/useCanvasResize", () => ({
    useCanvasResize: () => ({
        canvasRef: { current: document.createElement("canvas") },
        dimensions: { width: 667, height: 300 },
        scaleFactor: 1,
    }),
}));

vi.mock("hooks/useDisableScroll", () => ({
    useDisableScroll: vi.fn(),
}));

import Canvas from "screens/Canvas/Canvas";

const theme = createTheme({
    palette: {
        canvas: {
            background: "#ffffff",
            boxShadow: "rgba(0,0,0,0.5)",
        },
    } as any,
});

function renderCanvas(editorActive = true, onLastContribution = false) {
    mockSocketInfo.editorActive = editorActive;
    mockSocketInfo.onLastContribution = onLastContribution;
    return render(
        <ThemeProvider theme={theme}>
            <Canvas />
        </ThemeProvider>,
    );
}

// Helper: find the color input
function getColorInput() {
    return document.querySelector('input[type="color"]') as HTMLInputElement;
}

// Helper: find the palette icon button (sibling of the color input)
function getPaletteButton() {
    const colorInput = getColorInput();
    // The palette button is a sibling of the color input, both inside a <span>
    return colorInput?.parentElement?.querySelector("button") as HTMLButtonElement;
}

// Helper: find buttons by their SVG icon's data-testid
function getButtonBySvgTestId(testId: string) {
    const svg = document.querySelector(`[data-testid="${testId}"]`);
    return svg?.closest("button") as HTMLButtonElement | null;
}

describe("Canvas toolbar — color picker", () => {
    it("renders a color input element that is not wrapped in a <label>", () => {
        renderCanvas();
        const colorInput = getColorInput();
        expect(colorInput).not.toBeNull();
        // The input must NOT be inside a <label> element — the label pattern
        // is broken on iPadOS Safari where the native color picker never opens
        expect(colorInput!.closest("label")).toBeNull();
    });

    it("color input is visually hidden but present in the DOM", () => {
        renderCanvas();
        const colorInput = getColorInput();
        expect(colorInput).not.toBeNull();
        expect(colorInput.style.opacity).toBe("0");
        expect(colorInput.style.pointerEvents).toBe("none");
    });

    it("clicking the palette button triggers .click() on the color input", () => {
        renderCanvas();
        const colorInput = getColorInput();
        const clickSpy = vi.spyOn(colorInput, "click");
        const paletteButton = getPaletteButton();
        expect(paletteButton).not.toBeNull();

        fireEvent.click(paletteButton);
        expect(clickSpy).toHaveBeenCalledTimes(1);
        clickSpy.mockRestore();
    });

    it("color input change updates the value", () => {
        renderCanvas();
        const colorInput = getColorInput();
        expect(colorInput.value).toBe("#000000");

        fireEvent.change(colorInput, { target: { value: "#ff0000" } });
        expect(colorInput.value).toBe("#ff0000");
    });

    it("palette button is disabled when editor is not active", () => {
        renderCanvas(false);
        const paletteButton = getPaletteButton();
        expect(paletteButton).not.toBeNull();
        expect(paletteButton.disabled).toBe(true);
    });

    it("palette button is disabled when eraser is active", () => {
        renderCanvas(true);
        // Activate eraser
        const eraserButton = getButtonBySvgTestId("FormatColorResetIcon");
        expect(eraserButton).not.toBeNull();
        fireEvent.click(eraserButton!);

        // Palette should now be disabled
        const paletteButton = getPaletteButton();
        expect(paletteButton.disabled).toBe(true);
    });
});

describe("Canvas toolbar — eraser toggle", () => {
    it("eraser button is enabled when editor is active", () => {
        renderCanvas(true);
        const eraserButton = getButtonBySvgTestId("FormatColorResetIcon");
        expect(eraserButton).not.toBeNull();
        expect(eraserButton!.disabled).toBe(false);
    });

    it("eraser button is disabled when editor is not active", () => {
        renderCanvas(false);
        const eraserButton = getButtonBySvgTestId("FormatColorResetIcon");
        expect(eraserButton).not.toBeNull();
        expect(eraserButton!.disabled).toBe(true);
    });

    it("clicking eraser toggles its color to primary", () => {
        renderCanvas(true);
        const eraserButton = getButtonBySvgTestId("FormatColorResetIcon");
        expect(eraserButton).not.toBeNull();

        // Before click — default color (no primary class)
        expect(eraserButton!.className).not.toMatch(/colorPrimary/);

        fireEvent.click(eraserButton!);

        // After click — primary color
        expect(eraserButton!.className).toMatch(/colorPrimary/);
    });

    it("clicking eraser twice returns to default color", () => {
        renderCanvas(true);
        const eraserButton = getButtonBySvgTestId("FormatColorResetIcon");
        expect(eraserButton).not.toBeNull();

        fireEvent.click(eraserButton!);
        expect(eraserButton!.className).toMatch(/colorPrimary/);

        fireEvent.click(eraserButton!);
        expect(eraserButton!.className).not.toMatch(/colorPrimary/);
    });
});

describe("Canvas toolbar — undo/redo", () => {
    it("undo button is disabled with no stroke history", () => {
        renderCanvas(true);
        const undoButton = getButtonBySvgTestId("UndoIcon");
        expect(undoButton).not.toBeNull();
        expect(undoButton!.disabled).toBe(true);
    });

    it("redo button is disabled with no undone strokes", () => {
        renderCanvas(true);
        const redoButton = getButtonBySvgTestId("RedoIcon");
        expect(redoButton).not.toBeNull();
        expect(redoButton!.disabled).toBe(true);
    });
});

describe("Canvas toolbar — pass/done button", () => {
    it('shows "Pass" button when not on last contribution', () => {
        renderCanvas(true, false);
        expect(screen.getByText("Pass")).not.toBeNull();
    });

    it('shows "Done" button when on last contribution', () => {
        renderCanvas(true, true);
        expect(screen.getByText("Done")).not.toBeNull();
    });
});
