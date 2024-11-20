// src/screens/Canvas/index.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import { Point } from "../../types";
import { emitSendLastPanel, emitSendPanel } from "../../context/SocketRequestors";
import { useSocketInfo } from "../../context/SocketInfoProvider";
import { drawOnCanvas, setCanvasProperties } from "../../utils/canvasUtils";
import { useDisableScroll } from "../../hooks/useDisableScroll";
import { ScaleDirection, pixelRatio, scalePoints } from "../../utils/scaleUtils";
import { debounce } from "es-toolkit";

type ExtendedTouch = Touch & {
    force?: number;
    touchType?: string;
};

const DEFAULT_LINE_WIDTH = 30;
export const OVERLAP = 0.2;

const DEFAULT_PRESSURE = 0.1;
const lineColor = "grey";

export const PANEL_HEIGHT_MIN = 300; // retina is double
export const PANEL_WIDTH_MIN = 667;
export const PANEL_ASPECT_RATIO = PANEL_WIDTH_MIN / PANEL_HEIGHT_MIN;
export const DRAWING_HEIGHT_MIN = 3 * PANEL_HEIGHT_MIN - 2 * OVERLAP * PANEL_HEIGHT_MIN;
export const DRAWING_WIDTH_MIN = PANEL_WIDTH_MIN;
export const DRAWING_ASPECT_RATIO = DRAWING_WIDTH_MIN / DRAWING_HEIGHT_MIN;

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
    const [ dimensions, setDimensions ] = useState({ width: PANEL_WIDTH_MIN, height: PANEL_HEIGHT_MIN });
    const [ scaleFactor, setScaleFactor ] = useState<number>(1);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Disable scrolling
    useDisableScroll();

    // Handle resizing of the window
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const context = canvas.getContext("2d");
            if (!context) return;

            // context.clearRect(0, 0, canvas.width, canvas.height);

            setCanvasProperties(context);
    
            // Save the canvas image data so far
            // const imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);

            // Get the viewport width and calculate the new height to maintain the aspect ratio
            const viewportHeight = window.innerHeight - 100;
            const viewportWidth = window.innerWidth;
            const viewportAspectRatio = viewportWidth / viewportHeight;
            let newWidth;
            let newHeight;
            if (viewportAspectRatio < PANEL_ASPECT_RATIO) {
                newWidth = Math.max(viewportWidth, PANEL_WIDTH_MIN);
                newHeight = Math.max(newWidth / PANEL_ASPECT_RATIO, PANEL_HEIGHT_MIN);
            } else {
                newHeight = Math.max(viewportHeight, PANEL_HEIGHT_MIN);
                newWidth = Math.max(newHeight * PANEL_ASPECT_RATIO, PANEL_WIDTH_MIN);
            }

            // Determine the scaling factor and set the dimensions
            // This will cause the canvas element to resize and clear it
            setScaleFactor(newWidth / PANEL_WIDTH_MIN);
            setDimensions({ width: newWidth, height: newHeight });

            // race condition? set time out to test?
            // Now re-draw whatever was there before
            // context.putImageData(imageData, 0, 0);
            setTimeout(() => {
                console.log("Attempting draw of:", localStrokeHistory);
                console.log("Boolean context:", Boolean(context), context);
                setCanvasProperties(context);
                localStrokeHistory?.forEach((strokeArray) =>
                    drawOnCanvas(scalePoints(strokeArray, ScaleDirection.MULTIPLY, scaleFactor), 0, context),
                );
                setCanvasProperties(context);
            }, 5000);
        };

        const debouncedHandleResize = debounce(() => {
            console.log("Debounced handle resize");
            handleResize();
        }, 1000);

        handleResize();

        // Attach resize event listener
        window.addEventListener("resize", debouncedHandleResize);

        // Clean up event listener on component unmount
        return () => {
            debouncedHandleResize.cancel();
            window.removeEventListener("resize", debouncedHandleResize);
        };
    }, [ localStrokeHistory ]);

    // Set initial dimensions of the canvas
    // useEffect(() => {
    //     setCanvasDimensions(canvasRef.current, PANEL_WIDTH_MAX, PANEL_HEIGHT_MIN);
    // }, []);

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

        // Redraw
        strokeHistory?.forEach((strokeArray) =>
            drawOnCanvas(strokeArray, 0, context),
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
        const scaledPoints: Point[] = scalePoints(points, ScaleDirection.DIVIDE, scaleFactor);
        setLocalStrokeHistory((prev) => [ ...prev, scaledPoints ]);
        setPoints([]);
        setLineWidth(0);
    }, [ points ]);

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
                    pointerEvents: editorActive
                        ? "auto"
                        : "none",
                    opacity: editorActive
                        ? 1
                        : 0.5,
                    border: "1px solid black",
                    display: "block",        // Removes any padding/margin caused by inline canvas
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
