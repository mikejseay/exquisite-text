import { useCallback, useRef } from "react";
import { ModelState, RawLine, SketchRNN, Stroke } from "@magenta/sketch";
import { PEN, PenState } from "./types";

// Epsilon value to ignore tiny pen movements
const EPSILON = 2.0;

export interface SketchState {
    x: number;
    y: number;
    startX: number;
    startY: number;
    dx: number;
    dy: number;
    userPen: number;
    previousUserPen: number;
    pen: PenState;
    previousPen: PenState;
    modelState: ModelState | null;
    modelIsActive: boolean;
    userHasEverDrawn: boolean;
    mouseIsDown: boolean;
    allRawLines: RawLine[];
    currentRawLine: RawLine;
    strokes: Stroke[];
}

export interface UseSketchStateReturn {
    stateRef: React.MutableRefObject<SketchState>;
    resetState: (canvasWidth: number, canvasHeight: number) => void;
    handleMouseDown: (
        mouseX: number,
        mouseY: number,
        isInBounds: boolean,
        ctx: CanvasRenderingContext2D | null
    ) => void;
    handleMouseUp: (
        mouseX: number,
        mouseY: number,
        isInBounds: boolean,
        model: SketchRNN | null,
        initRNNStateFromStrokes: (strokes: Stroke[]) => void
    ) => void;
    handleMouseDrag: (
        mouseX: number,
        mouseY: number,
        isInBounds: boolean,
        ctx: CanvasRenderingContext2D | null
    ) => void;
    updateFromModel: (
        model: SketchRNN,
        temperature: number,
        ctx: CanvasRenderingContext2D | null,
        initRNNStateFromStrokes: (strokes: Stroke[]) => void
    ) => void;
}

export function useSketchState(): UseSketchStateReturn {
    const stateRef = useRef<SketchState>({
        x: 0,
        y: 0,
        startX: 0,
        startY: 0,
        dx: 0,
        dy: 0,
        userPen: 1,
        previousUserPen: 0,
        pen: [ 0, 0, 0 ],
        previousPen: [ 1, 0, 0 ],
        modelState: null,
        modelIsActive: false,
        userHasEverDrawn: false,
        mouseIsDown: false,
        allRawLines: [],
        currentRawLine: [],
        strokes: [],
    });

    const resetState = useCallback((canvasWidth: number, canvasHeight: number) => {
        const state = stateRef.current;
        state.startX = state.x = canvasWidth / 2.0;
        state.startY = state.y = canvasHeight / 3.0;
        state.dx = 0;
        state.dy = 0;
        state.userPen = 1;
        state.previousUserPen = 0;
        state.pen = [ 0, 0, 0 ];
        state.previousPen = [ 0, 1, 0 ];
        state.modelState = null;
        state.modelIsActive = false;
        state.userHasEverDrawn = false;
        state.mouseIsDown = false;
        state.allRawLines = [];
        state.currentRawLine = [];
        state.strokes = [];
    }, []);

    const handleMouseDown = useCallback((
        mouseX: number,
        mouseY: number,
        isInBounds: boolean,
        ctx: CanvasRenderingContext2D | null,
    ) => {
        if (!isInBounds) return;

        const state = stateRef.current;

        // First time anything is written
        if (!state.userHasEverDrawn) {
            state.userHasEverDrawn = true;
            state.x = state.startX = mouseX;
            state.y = state.startY = mouseY;
            state.userPen = 1; // down!
        }

        state.modelIsActive = false;
        state.previousUserPen = state.userPen;
        state.mouseIsDown = true;

        // Set stroke color to red for user drawing
        if (ctx) {
            ctx.strokeStyle = "rgb(255, 0, 0)";
        }
    }, []);

    const handleMouseUp = useCallback((
        mouseX: number,
        mouseY: number,
        isInBounds: boolean,
        model: SketchRNN | null,
        initRNNStateFromStrokes: (strokes: Stroke[]) => void,
    ) => {
        const state = stateRef.current;
        state.mouseIsDown = false;

        if (!isInBounds || !model) return;

        state.userPen = 0; // Up!

        const currentRawLineSimplified = model.simplifyLine(state.currentRawLine);
        let lastX: number, lastY: number;

        // If it's an accident...ignore it.
        if (currentRawLineSimplified.length > 1) {
            // Need to keep track of the first point of the last line.
            if (state.allRawLines.length === 0) {
                lastX = state.startX;
                lastY = state.startY;
            } else {
                // The last line.
                const idx = state.allRawLines.length - 1;
                const lastPoint = state.allRawLines[idx][state.allRawLines[idx].length - 1];
                lastX = lastPoint[0];
                lastY = lastPoint[1];
            }

            // Encode this line as a stroke, and feed it to the model.
            const stroke = model.lineToStroke(currentRawLineSimplified, [ lastX, lastY ]);
            state.allRawLines.push(currentRawLineSimplified);
            state.strokes = state.strokes.concat(stroke);

            initRNNStateFromStrokes(state.strokes);
        }
        state.currentRawLine = [];
        state.modelIsActive = true;
        state.previousUserPen = state.userPen;
    }, []);

    const handleMouseDrag = useCallback((
        mouseX: number,
        mouseY: number,
        isInBounds: boolean,
        ctx: CanvasRenderingContext2D | null,
    ) => {
        const state = stateRef.current;

        // Only draw when mouse button is held down (like p5.js mouseDragged)
        if (!state.mouseIsDown || state.modelIsActive || !isInBounds || !ctx) return;

        const dx0 = mouseX - state.x; // Candidate for dx
        const dy0 = mouseY - state.y; // Candidate for dy

        if (dx0 * dx0 + dy0 * dy0 > EPSILON * EPSILON) {
            // Only if pen is not in same area
            state.dx = dx0;
            state.dy = dy0;
            state.userPen = 1;

            if (state.previousUserPen === 1) {
                // Draw line connecting prev point to current point
                ctx.beginPath();
                ctx.moveTo(state.x, state.y);
                ctx.lineTo(state.x + state.dx, state.y + state.dy);
                ctx.stroke();
            }

            state.x += state.dx;
            state.y += state.dy;
            state.currentRawLine.push([ state.x, state.y ]);
        }
        state.previousUserPen = state.userPen;
    }, []);

    const updateFromModel = useCallback((
        model: SketchRNN,
        temperature: number,
        ctx: CanvasRenderingContext2D | null,
        initRNNStateFromStrokes: (strokes: Stroke[]) => void,
    ) => {
        const state = stateRef.current;

        if (!state.modelIsActive || !state.modelState || !ctx) return;

        // New state
        state.pen = state.previousPen;
        state.modelState = model.update(
            [ state.dx, state.dy, ...state.pen ],
            state.modelState,
        );
        const pdf = model.getPDF(state.modelState, temperature);
        const sample = model.sample(pdf);
        state.dx = sample[0];
        state.dy = sample[1];
        state.pen = [ sample[2], sample[3], sample[4] ];

        // If we finished the previous drawing, start a new one
        if (state.pen[PEN.END] === 1) {
            initRNNStateFromStrokes(state.strokes);
        } else {
            // Only draw on the paper if the pen is still touching the paper
            if (state.previousPen[PEN.DOWN] === 1) {
                ctx.beginPath();
                ctx.moveTo(state.x, state.y);
                ctx.lineTo(state.x + state.dx, state.y + state.dy);
                ctx.stroke();
            }
            // Update
            state.x += state.dx;
            state.y += state.dy;
            state.previousPen = state.pen;
        }
    }, []);

    return {
        stateRef,
        resetState,
        handleMouseDown,
        handleMouseUp,
        handleMouseDrag,
        updateFromModel,
    };
}

/**
 * Draw strokes on the canvas
 */
export function drawStrokes(
    ctx: CanvasRenderingContext2D,
    strokes: Stroke[],
    startX: number,
    startY: number,
): void {
    ctx.strokeStyle = "rgb(255, 0, 0)";

    let x = startX;
    let y = startY;
    let pen: PenState = [ 0, 0, 0 ];
    let previousPen: PenState = [ 1, 0, 0 ];

    for (let i = 0; i < strokes.length; i++) {
        const [ dx, dy, p0, p1, p2 ] = strokes[i];
        pen = [ p0, p1, p2 ];

        if (previousPen[PEN.END] === 1) {
            // End of drawing
            break;
        }

        // Only draw on the paper if the pen is still touching the paper
        if (previousPen[PEN.DOWN] === 1) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + dx, y + dy);
            ctx.stroke();
        }

        x += dx;
        y += dy;
        previousPen = pen;
    }
}

/**
 * Set a random stroke color for the model's drawing
 */
export function setRandomModelColor(ctx: CanvasRenderingContext2D): void {
    const r = Math.floor(Math.random() * 160) + 64;
    const g = Math.floor(Math.random() * 160) + 64;
    const b = Math.floor(Math.random() * 160) + 64;
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
}
