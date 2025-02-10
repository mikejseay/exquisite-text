// src/screens/Canvas/index.tsx
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import { debounce } from "es-toolkit";

import { Point } from "../../types";
import { emitSendLastPanel, emitSendPanel } from "../../context/SocketRequestors";
import { useSocketInfo } from "../../context/SocketInfoProvider";
import { drawOnCanvas } from "../../utils/canvasUtils";
import { useDisableScroll } from "../../hooks/useDisableScroll";
import { ScaleDirection, pixelRatio, scalePoints } from "../../utils/scaleUtils";
import { aboveCanvasHeight } from "../../constants";

/* TODO:
    * Function to consolidate drawing of snippet code (don't repeat that code)
    * Spectator functionality
*/

type ExtendedTouch = Touch & {
    force?: number;
    touchType?: string;
};

const DEFAULT_LINE_WIDTH = 8;
export const OVERLAP = 0.2;

const DEFAULT_PRESSURE = 0.1;

export const PANEL_HEIGHT_MIN = 300; // retina is double
export const PANEL_WIDTH_MIN = 667;
export const PANEL_ASPECT_RATIO = PANEL_WIDTH_MIN / PANEL_HEIGHT_MIN;
export const DRAWING_HEIGHT_MIN = 3 * PANEL_HEIGHT_MIN - 2 * OVERLAP * PANEL_HEIGHT_MIN;
export const DRAWING_WIDTH_MIN = PANEL_WIDTH_MIN;
export const DRAWING_ASPECT_RATIO = DRAWING_WIDTH_MIN / DRAWING_HEIGHT_MIN;

const Canvas: React.FC = () => {
    const { strokeHistory, panels, completedDrawings, editorActive, onLastContribution, setEditorActive, medium } = useSocketInfo();    const [ isPassCompleteDisabled, setIsPassCompleteDisabled ] = useState(false);
    const [ points, setPoints ] = useState<Point[]>([]);
    const [ localStrokeHistory, setLocalStrokeHistory ] = useState<Point[][]>([]);
    const [ isMousedown, setIsMousedown ] = useState(false);
    const [ allowDirect, setAllowDirect ] = useState(true);
    const [ lineWidth, setLineWidth ] = useState(0);
    const [ drawType, setDrawType ] = useState<"fill" | "stroke" | "noDrawYet">("noDrawYet");
    const [ player, setPlayer ] = useState<number>(0);
    const [ coordinates, setCoordinates ] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [ eventPressure, setEventPressure ] = useState(DEFAULT_PRESSURE);
    const [ dimensions, setDimensions ] = useState({ width: PANEL_WIDTH_MIN, height: PANEL_HEIGHT_MIN });
    const [ scaleFactor, setScaleFactor ] = useState<number>(1);
    const localStrokeHistoryRef = useRef<Point[][]>(localStrokeHistory);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        localStrokeHistoryRef.current = localStrokeHistory;
    }, [ localStrokeHistory ]);

    useDisableScroll();

    // Handle resizing of the window
    useLayoutEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const context = canvas.getContext("2d");
            if (!context) return;

            // Calculate new dimensions
            const viewportHeight = window.innerHeight - aboveCanvasHeight;
            const viewportWidth = window.innerWidth;
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

            const newScaleFactor = newWidth / PANEL_WIDTH_MIN;
            console.log("New Scale Factor:", newScaleFactor);

            // Update state for layout purposes
            setDimensions({ width: newWidth, height: newHeight });
            setScaleFactor(newScaleFactor);
        };

        const debouncedHandleResize = debounce(() => {
            console.log("Debounced handle resize");
            handleResize();
        }, 200); // Reduced debounce delay

        // Initial resize to set up canvas correctly
        handleResize();

        window.addEventListener("resize", debouncedHandleResize);

        return () => {
            debouncedHandleResize.cancel();
            window.removeEventListener("resize", debouncedHandleResize);
        };
    }, []);

    // Redraw the canvas whenever dimensions or scaleFactor change
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        console.log("Redrawing canvas with dimensions:", dimensions, "and scaleFactor:", scaleFactor);

        context.clearRect(0, 0, canvas.width, canvas.height);

        // Redraw
        strokeHistory?.forEach((strokeArray) =>
            drawOnCanvas(
                scalePoints(strokeArray, ScaleDirection.MULTIPLY, scaleFactor),
                0,
                context,
            ),
        );

        // Clip
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

        localStrokeHistoryRef.current?.forEach((strokeArray, index) => {
            drawOnCanvas(
                scalePoints(strokeArray, ScaleDirection.MULTIPLY, scaleFactor),
                0,
                context,
            );
            console.log(`Redrew strokeArray #${index}`);
        });
    }, [ dimensions, scaleFactor, editorActive ]);

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
                x = (touch.pageX - canvasBounds.left - window.scrollX);
                y = (touch.pageY - canvasBounds.top - window.scrollY);

                if (allowDirect || (touch && touch.touchType !== "direct")) {
                    if (touch.force && touch.force > 0) {
                        pressure = touch.force;
                        setEventPressure(pressure);
                    }
                }
            } else {
                pressure = 1.0;
                x = (e.pageX - canvasBounds.left - window.scrollX);
                y = (e.pageY - canvasBounds.top - window.scrollY);
            }

            setCoordinates({ x, y });
            setIsMousedown(true);

            const computedLineWidth = Math.log(pressure + 1) * DEFAULT_LINE_WIDTH * scaleFactor;
            setLineWidth(computedLineWidth);
            const newPoint = { x, y, lineWidth: computedLineWidth };
            setPoints((prev) => [ ...prev, newPoint ]);

            drawOnCanvas([ newPoint ], 0, context);
        },
        [ allowDirect, scaleFactor ],
    );

    const debouncedEmitPanel = useCallback(
        debounce((currentPanel: Point[][]) => {
            emitSendPanel(currentPanel);
        }, 200),
        [],
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
                    x = (touch.pageX - canvasBounds.left - window.scrollX);
                    y = (touch.pageY - canvasBounds.top - window.scrollY);
                }
                y = (touch.pageY - canvasBounds.top);
            } else {
                pressure = 1.0;
                x = (e.pageX - canvasBounds.left - window.scrollX);
                y = (e.pageY - canvasBounds.top - window.scrollY);
            }
            setCoordinates({ x, y });

            const computedLineWidth = Math.log(pressure + 1) * DEFAULT_LINE_WIDTH * scaleFactor;
            setLineWidth(computedLineWidth);
            const newPoint = { x, y, lineWidth: computedLineWidth };

            setPoints((prev) => {
                const lastPoint = prev[prev.length - 1];
                if (lastPoint) {
                    drawOnCanvas([ lastPoint, newPoint ], 0, context);
                    console.log("Drawn line segment in handleMove:", lastPoint, newPoint);
                }
                return [ ...prev, newPoint ];
            });

            const currentPanel = [ ...localStrokeHistory, points ];
            debouncedEmitPanel(currentPanel);
        },
        [ allowDirect, isMousedown, scaleFactor ],
    );

    const handleEnd = useCallback(() => {
        setIsMousedown(false);
        const scaledPoints: Point[] = scalePoints(points, ScaleDirection.DIVIDE, scaleFactor);
        setLocalStrokeHistory((prev) => [ ...prev, scaledPoints ]);
        setPoints([]);
        setLineWidth(0);
        console.log("Stroke ended and scaled points added to history");
    }, [ points, scaleFactor ]);

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            {/*<p style={{ textAlign: "center" }}>*/}
            {/*    {"Pressure: " + eventPressure}*/}
            {/*    <br />*/}
            {/*    {"Line Width: " + lineWidth}*/}
            {/*    <br />*/}
            {/*    {"Draw Type: " + drawType}*/}
            {/*    <br />*/}
            {/*    {"Current Player: " + player}*/}
            {/*    <br />*/}
            {/*    {"Coordinates: " + JSON.stringify(coordinates)}*/}
            {/*</p>*/}
            {/*<Button onClick={() => setAllowDirect(!allowDirect)}>Toggle Direct</Button>*/}
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
                width={dimensions.width * pixelRatio}
                height={dimensions.height * pixelRatio}
                style={{
                    width: `${dimensions.width}px`,
                    height: `${dimensions.height}px`,
                    border: "1px solid black",
                    display: "block",
                    pointerEvents: editorActive
                        ? "auto"
                        : "none",
                    opacity: editorActive
                        ? 1
                        : 0.5,
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
