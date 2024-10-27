// src/screens/Canvas/index.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import { Point } from "../../types";
import { emitSendLastPanel, emitSendPanel } from "../../context/SocketRequestors";
import { useSocketInfo } from "../../context/SocketInfoProvider";
import { ScaleDirection, pixelRatio, scalePoints } from "../../utils/scaleUtils";
import { drawOnCanvas, setCanvasDimensions, setCanvasProperties } from "../../utils/canvasUtils";
import { useDisableScroll } from "../../hooks/useDisableScroll";

type ExtendedTouch = Touch & {
    force?: number;
    touchType?: string;
};

const DEFAULT_LINE_WIDTH = 30;
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


const Canvas: React.FC = () => {
    const { strokeHistory, editorActive, onLastContribution, setEditorActive } = useSocketInfo();
    const [ isPassCompleteDisabled, setIsPassCompleteDisabled ] = useState(false);
    const [ points, setPoints ] = useState<Point[]>([]);
    const [ localStrokeHistory, setLocalStrokeHistory ] = useState<Point[][]>([]);
    const [ isMousedown, setIsMousedown ] = useState(false);
    const [ allowDirect, setAllowDirect ] = useState(true);
    const [ lineWidth, setLineWidth ] = useState(0);
    const [ eventPressure, setEventPressure ] = useState(DEFAULT_PRESSURE);
    const [ drawType, setDrawType ] = useState<"fill" | "stroke" | "noDrawYet">("noDrawYet");
    const [ player, setPlayer ] = useState<number>(0);
    const [ coordinates, setCoordinates ] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Disable scrolling
    useDisableScroll();

    // Set initial dimensions of the canvas
    useEffect(() => {
        setCanvasDimensions(canvasRef.current, PANEL_WIDTH, PANEL_HEIGHT);
    }, []);

    // Handle changes in editorActive (when it becomes your turn)
    useEffect(() => {
        setIsPassCompleteDisabled(!editorActive);
        if (!editorActive) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        context.clearRect(0, 0, canvas.width, canvas.height);

        setCanvasProperties(context);

        strokeHistory?.forEach((strokeArray) =>
            drawOnCanvas(strokeArray, 0, context),
        );

        const imageData = context.getImageData(
            0,
            context.canvas.height * (1 - OVERLAP),
            context.canvas.width,
            context.canvas.height,
        );
        context.putImageData(imageData, 0, 0);
        context.clearRect(
            context.canvas.width,
            context.canvas.height * OVERLAP,
            0,
            context.canvas.height,
        );
    }, [ editorActive ]);

    function passTurn() {
        emitSendPanel(localStrokeHistory);
        setPoints([]);
        setLocalStrokeHistory([]);
        setEditorActive(false);
    }

    function completeDrawing() {
        emitSendLastPanel(localStrokeHistory);
        setLocalStrokeHistory([]);
        setIsPassCompleteDisabled(false);
    }

    const handleStart = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            let pressure = DEFAULT_PRESSURE;
            let x = 0;
            let y = 0;

            const canvas = canvasRef.current;
            if (!canvas) return;
            const context = canvas.getContext("2d");
            if (!context) return;

            const canvasBounds = canvas.getBoundingClientRect();

            if ("touches" in e) {
                const touch = e.touches[0] as ExtendedTouch;
                x = (touch.pageX - canvasBounds.left - window.scrollX) * pixelRatio;
                y = (touch.pageY - canvasBounds.top - window.scrollY) * pixelRatio;

                if (allowDirect || (touch && touch.touchType !== "direct")) {
                    if (touch.force && touch.force > 0) {
                        pressure = touch.force;
                        setEventPressure(pressure);
                    }
                }
            } else {
                pressure = 1.0;
                x = (e.pageX - canvasBounds.left - window.scrollX) * pixelRatio;
                y = (e.pageY - canvasBounds.top - window.scrollY) * pixelRatio;
            }

            setCoordinates({ x, y });
            setIsMousedown(true);

            setLineWidth(Math.log(pressure + 1) * DEFAULT_LINE_WIDTH);
            const newPoint = { x, y, lineWidth: Math.log(pressure + 1) * DEFAULT_LINE_WIDTH };
            setPoints((prev) => [ ...prev, newPoint ]);
            // setCanvasProperties(context);
            drawOnCanvas([ newPoint ], 0, context);
        },
        [ allowDirect ],
    );

    const handleMove = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            if (!isMousedown) return;
            e.preventDefault();

            let pressure = DEFAULT_PRESSURE;
            let x = 0;
            let y = 0;

            const canvas = canvasRef.current;
            if (!canvas) return;
            const context = canvas.getContext("2d");
            if (!context) return;

            const canvasBounds = canvas.getBoundingClientRect();

            if ("touches" in e) {
                const touch = e.touches[0] as ExtendedTouch;

                if (allowDirect || (touch && touch.touchType !== "direct")) {
                    if (touch.force && touch.force > 0) {
                        pressure = touch.force;
                        setEventPressure(pressure);
                    }
                    x = (touch.pageX - canvasBounds.left - window.scrollX) * pixelRatio;
                    y = (touch.pageY - canvasBounds.top - window.scrollY) * pixelRatio;
                }
                y = (touch.pageY - canvasBounds.top) * pixelRatio;
            } else {
                pressure = 1.0;
                x = (e.pageX - canvasBounds.left - window.scrollX) * pixelRatio;
                y = (e.pageY - canvasBounds.top - window.scrollY) * pixelRatio;
            }
            setCoordinates({ x, y });

            setLineWidth(Math.log(pressure + 1) * DEFAULT_LINE_WIDTH);
            const newPoint = { x, y, lineWidth: Math.log(pressure + 1) * DEFAULT_LINE_WIDTH };
            // setCanvasProperties(context);
            setPoints((prev) => {
                drawOnCanvas([ prev[prev.length - 1], newPoint ], 0, context);
                return [ ...prev, newPoint ];
            });
        },
        [ allowDirect, isMousedown ],
    );

    const handleEnd = useCallback(() => {
        setIsMousedown(false);
        const scaledPoints: Point[] = scalePoints(points, ScaleDirection.DIVIDE);
        setLocalStrokeHistory((prev) => [ ...prev, scaledPoints ]);
        setPoints([]);
        setLineWidth(0);
    }, [ points ]);

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <p style={{ textAlign: "center" }}>
                {"Pressure: " + eventPressure}
                <br />
                {"Line Width: " + lineWidth}
                <br />
                {"Draw Type: " + drawType}
                <br />
                {"Current Player: " + player}
                <br />
                {"Coordinates: " + JSON.stringify(coordinates)}
            </p>
            <Button onClick={() => setAllowDirect(!allowDirect)}>Toggle Direct</Button>
            <Button
                disabled={isPassCompleteDisabled}
                onClick={onLastContribution
                    ? completeDrawing
                    : passTurn}
            >
                {onLastContribution
                    ? "Complete Drawing"
                    : "Pass"}
            </Button>
            <canvas
                ref={canvasRef}
                style={{
                    pointerEvents: editorActive
                        ? "auto"
                        : "none",
                    opacity: editorActive
                        ? 1
                        : 0.5,
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
