import React, { useCallback, useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import { Point } from "../../types";
import { emitSendLastPanel, emitSendPanel } from "../../context/SocketRequestors";
import { useSocketInfo } from "../../context/SocketInfoProvider";

type ExtendedTouch = Touch & {
    force?: number;
    touchType?: string;
};

const DEFAULT_LINE_WIDTH = 30;
export const PANEL_HEIGHT_RATIO_OF_WINDOW = 0.3;
export const DRAWING_HEIGHT_RATIO_OF_WINDOW = 0.8;
export const OVERLAP = 0.2;
const DEFAULT_PRESSURE = 0.1;
const lineColor = "grey";

export const PANEL_HEIGHT = 300; // retina is double
export const PANEL_WIDTH = 667;
export const DRAWING_HEIGHT = 3 * PANEL_HEIGHT - 2 * OVERLAP * PANEL_HEIGHT;
export const DRAWING_WIDTH = PANEL_WIDTH;

// iPhone SE: 667 x 375
// NOTE: window.devicePixelRatio is 2 for retina screens

/* TODO:
    [ ] Canvas and panel height are established at the start of the game, and become a property of the room
    [ ] Players are forced to have canvases of the appropriate height regardless of their window size
    [ ] Spectator view
    [ ] Ensure that spectator receives entire drawing instead of just single frame
    [-] Modularize all server socket functions to work with both poems and canvases
    [ ] For the watcher, the cursor is not in right spot until writer starts writing:
        As a part of reinstateContext, find the editor you're supposed to be spectating,
        Find the poem they're editing, get the current line edit, and send it via "stcLineEditorWatch"
*/

export function drawOnCanvas (newPoints: Point[], canvasRef: React.MutableRefObject<HTMLCanvasElement | null>, yOffset = 0) {
    if (!newPoints || !newPoints.length) return;

    if (!canvasRef) {
        console.warn("No canvasRef in drawOnCanvas");
        return;
    }
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!context) {
        console.warn("No context in drawOnCanvas");
        return;
    }

    context.strokeStyle = lineColor;
    context.lineCap = "round";
    context.lineJoin = "round";

    // newPoints is length 1 if being drawn by handleStart
    if (newPoints.length === 1) {
        const point = newPoints[0];
        context.fillStyle = lineColor;
        context.lineWidth = point.lineWidth;
        context.beginPath();
        context.arc(point.x, point.y + yOffset, point.lineWidth / 2, 0, Math.PI * 2);
        context.closePath();
        context.fill();
        return;
    }

    context.beginPath();

    // newPoints is length 2 if being drawn by handleMove
    for (let i = 0; i < newPoints.length - 1; i++) {
        const startPoint = newPoints[i];
        const endPoint = newPoints[i + 1];

        context.moveTo(startPoint?.x, startPoint?.y + yOffset);
        context.lineWidth = startPoint?.lineWidth;
        context.lineTo(endPoint?.x, endPoint?.y + yOffset);
        context.stroke();
    }
}

const Canvas: React.FC = () => {
    const { strokeHistory, editorActive, onLastContribution, setEditorActive } = useSocketInfo();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [ isPassCompleteDisabled, setIsPassCompleteDisabled ] = useState(false);
    const [ points, setPoints ] = useState<Point[]>([]);
    const [ localStrokeHistory, setLocalStrokeHistory ] = useState<Point[][]>([]);
    const [ isMousedown, setIsMousedown ] = useState(false);
    const [ allowDirect, setAllowDirect ] = useState(true);
    const [ lineWidth, setLineWidth ] = useState(0);
    const [ eventPressure, setEventPressure ] = useState(DEFAULT_PRESSURE);
    const [ drawType, setDrawType ] = useState<"fill" | "stroke" | "noDrawYet">("noDrawYet");
    const [ coordinates, setCoordinates ] = useState<{ x: number, y: number}>({ x: 0, y: 0 });

    // TODO: handle all functionality that must toggle with editorActive
    React.useEffect(() => {
        console.log("window.devicePixelRatio:", window?.devicePixelRatio);
        console.log("editorActive useEffect activated", editorActive);
        console.log("strokeHistory.length:", strokeHistory?.length);
        console.log("localStrokeHistory.length:", localStrokeHistory?.length);
        setIsPassCompleteDisabled(!editorActive);
        // TODO: This borks mouse canvas size positioning, probably because
        // viewport is changing in browser window, can use canvas empty placeholder
        // that is unclickable, or just legit clear that shit:
        console.log({ editorActive });
        if (!editorActive) return;

        // Process the stroke history to visually clip it
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (canvas && context) {
            // Clear canvas
            context.clearRect(0, 0, canvas.width, canvas.height);

            // Redraw stroke history onto blank canvas
            // TODO: Universalize drawing function for multiply or divide
            strokeHistory?.forEach(strokeArray => drawOnCanvas(strokeArray?.map(point => ({
                x: point.x * window.devicePixelRatio,
                y: point.y * window.devicePixelRatio,
                lineWidth: point.lineWidth * window.devicePixelRatio,
            })), canvasRef));
            console.log({ strokeHistory });
            //// This accomplishes the clipping of the image: ////

            // Shift canvas contents upward by 0.8 times the canvas height (old method)
            const imageData = context.getImageData(0, context.canvas.height * (1 - OVERLAP), context.canvas.width, context.canvas.height);
            context.putImageData(imageData, 0, 0);
            context.clearRect(context.canvas.width, context.canvas.height * OVERLAP, 0, context.canvas.height);
            console.log("context.canvas.height/width:", context.canvas.width, context.canvas.height);
        }
        return;
    }, [ editorActive ]);

    function passTurn() {
        // Convert pixel values to pixel-free values??
        // In future let people with more pixels to use them while they're drawing
        // use window characteristics to determine the best aspect ratio for them, and set their
        // canvas that way
        emitSendPanel(localStrokeHistory);
        setPoints([]);
        setLocalStrokeHistory([]);
        // TODO: Eventually this should maybe be handled on the backend?
        setEditorActive(false);
    }

    function completeDrawing() {
        // post the current input to the lines
        emitSendLastPanel(localStrokeHistory);
        console.log({ localStrokeHistory });

        // initialize the Canvas
        setLocalStrokeHistory([]);
        setIsPassCompleteDisabled(false);

        return;
    }

    const handleStart = useCallback((e: React.MouseEvent<Element, MouseEvent> | React.TouchEvent) => {
        let pressure = DEFAULT_PRESSURE;
        let x = 0;
        let y = 0;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const canvasBounds = canvas.getBoundingClientRect();

        if ("touches" in e) {
            const touch = e.touches[0] as ExtendedTouch;
            x = ((touch.pageX - canvasBounds.left - window.scrollX) * window.devicePixelRatio);
            y = ((touch.pageY - canvasBounds.top - window.scrollY) * window.devicePixelRatio);

            if (allowDirect || (touch && touch.touchType !== "direct")) {
                if (touch.force && touch.force > 0) {
                    pressure = touch.force;
                    setEventPressure(pressure);
                }
            }
        } else {
            pressure = 1.0;
            x = (e.pageX - canvasBounds.left - window.scrollX) * window.devicePixelRatio;
            y = (e.pageY - canvasBounds.top - window.scrollY) * window.devicePixelRatio;
        }

        setCoordinates({ x, y });
        setIsMousedown(true);

        setLineWidth(Math.log(pressure + 1) * DEFAULT_LINE_WIDTH);
        const newPoint = { x, y, lineWidth: Math.log(pressure + 1) * DEFAULT_LINE_WIDTH };
        setPoints((prev) => [ ...prev, newPoint ]);
        drawOnCanvas([ newPoint ], canvasRef);
    }, [ allowDirect, drawOnCanvas ]);

    const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!isMousedown) {
            return;
        }
        e.preventDefault();

        let pressure = DEFAULT_PRESSURE;
        let x = 0;
        let y = 0;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const canvasBounds = canvas.getBoundingClientRect();

        if ("touches" in e) {
            const touch = e.touches[0] as ExtendedTouch;

            if (allowDirect || (touch && touch.touchType !== "direct")) {
                if (touch.force && touch.force > 0) {
                    pressure = touch.force;
                    setEventPressure(pressure);
                }
                x = ((touch.pageX - canvasBounds.left - window.scrollX) * window.devicePixelRatio);
                y = ((touch.pageY - canvasBounds.top - window.scrollY) * window.devicePixelRatio);
            }
            y = ((touch.pageY - canvasBounds.top) * window.devicePixelRatio);

        } else {
            pressure = 1.0;
            x = (e.pageX - canvasBounds.left - window.scrollX) * window.devicePixelRatio;
            y = (e.pageY - canvasBounds.top - window.scrollY) * window.devicePixelRatio;
        }
        setCoordinates({ x, y });

        setLineWidth(Math.log(pressure + 1) * DEFAULT_LINE_WIDTH);
        const newPoint = { x, y, lineWidth: Math.log(pressure + 1) * DEFAULT_LINE_WIDTH };
        setPoints((prev) => {
            drawOnCanvas([ prev[prev.length - 1], newPoint ], canvasRef);
            return [ ...prev, newPoint ];
        });
    }, [ allowDirect, drawOnCanvas, isMousedown ]);

    const handleEnd = useCallback(() => {
        setIsMousedown(false);
        const scaledPoints: Point[] = points.map(point => ({
            x: point.x / window.devicePixelRatio,
            y: point.y / window.devicePixelRatio,
            lineWidth: point.lineWidth / window.devicePixelRatio,
        }));
        setLocalStrokeHistory((prev) => [ ...prev, scaledPoints ]);
        setPoints([]);
        setLineWidth(0);
    }, [ points ]);


    // This useEffect defines the panel height
    useEffect(() => {
        const canvas = canvasRef.current;
        const devicePixelRatio = window.devicePixelRatio ?? 1;

        if (!canvas) return;
        canvas.style.width = `${PANEL_WIDTH}px`;
        canvas.style.height = `${PANEL_HEIGHT}px`;
        canvas.width = PANEL_WIDTH * devicePixelRatio;
        canvas.height = PANEL_HEIGHT * devicePixelRatio;
        console.log("canvas.height:", canvas.height);
    }, []);

    useEffect(() => {
        const disableScroll = (e: TouchEvent) => e.preventDefault();
        document.body.addEventListener("touchmove", disableScroll, { passive: false });

        return () => {
            document.body.removeEventListener("touchmove", disableScroll);
        };
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <p style={{ textAlign: "center" }}>
                {"Pressure: " + eventPressure}
                <br />
                {"Line Width: " + lineWidth}
                <br />
                {"Draw Type: " + drawType}
                <br />
                {"Coordinates: " + JSON.stringify(coordinates)}
            </p>
            <Button onClick={() => setAllowDirect(!allowDirect)}>Toggle Direct</Button>
            {/* TODO: */}
            <Button disabled={isPassCompleteDisabled} onClick={onLastContribution
                ? completeDrawing
                : passTurn}>
                {onLastContribution
                    ? "Complete Drawing"
                    : "Pass"}
            </Button>
            <canvas
                ref={canvasRef}
                style={{
                    pointerEvents: editorActive
                        ? "auto"
                        : "none", // Disable pointer events if editor is not active
                    opacity: editorActive
                        ? 1
                        : 0.5, // Optionally change opacity to visually indicate inactivity
                    border: "1px solid black",
                }}
                onMouseDown={handleStart}
                onTouchStart={handleStart}
                onMouseMove={handleMove}
                onTouchMove={handleMove}
                onMouseUp={handleEnd}
                onTouchEnd={handleEnd}
            >
                    Sorry, your browser is too old for this demo.
            </canvas>
        </div>
    );
};

export default Canvas;
