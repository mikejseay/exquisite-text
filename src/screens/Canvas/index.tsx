// src/screens/Canvas/index.tsx
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import { debounce } from "es-toolkit";
import FormatColorResetIcon from "@mui/icons-material/FormatColorReset";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";

import { logger } from "../../utilities/loggerUtils";
import { Point } from "../../types";
import { emitSendLastPanel, emitSendPanel, emitSendPanelEdit } from "../../context/SocketRequestors";
import { useSocketInfo } from "../../context/SocketInfoProvider";
import { DEFAULT_COLOR, drawOnCanvas } from "../../utilities/canvasUtils";
import { useDisableScroll } from "../../hooks/useDisableScroll";
import { ScaleDirection, pixelRatio, scalePoints } from "../../utilities/scaleUtils";
import { aboveCanvasHeight } from "../../constants";

/* // TODO:
    * Change buttons at bottom to contained, and tweak MUI theme files colors so inherit color looks good
        in dark and light mode, center buttons horizontally, add padding between buttons and between buttons
        and canvas. Also make sure mouseover color picker is consistent cursor type in all areas of button
    * Pass button at bottom, consistent with exquisite text and with other buttons?
    * Conduct iPad testing, especially with color picker
    * Make UI Pretty and cohesive, polish, make color picker similar look/feel to 
        eraser/undo/redo buttons
    * General code quality - not multiple components in MultipleDrawings.tsx
    * One player two drawings, it should alternate between drawings
    * Two players two drawings, one drawing is complete, player gets no visual feedback that
        they're waiting on the other player
    * Spectator view currently defaults to carousel, but if enough real estate is available
        We could consider laying them out as two columns
    * Spectator and end screen views
    * Lobby vertically centered, probably too far down the page
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
    const theme = useTheme();
    const { strokeHistory, editorActive, onLastContribution } = useSocketInfo();
    const [ isDrawingComplete, setIsDrawingComplete ] = useState(false);
    const [ points, setPoints ] = useState<Point[]>([]);
    const [ localStrokeHistory, setLocalStrokeHistory ] = useState<Point[][]>([]);
    const [ undidStrokeHistory, setUndidStrokeHistory ] = useState<Point[][]>([]);
    const [ isMousedown, setIsMousedown ] = useState(false);
    const [ allowDirect, setAllowDirect ] = useState(true);
    const [ passEnabled, setPassEnabled ] = useState(false);
    const [ lineWidth, setLineWidth ] = useState(0);
    const [ drawType, setDrawType ] = useState<"fill" | "stroke" | "noDrawYet">("noDrawYet");
    const [ player, setPlayer ] = useState<number>(0);
    const [ coordinates, setCoordinates ] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [ eventPressure, setEventPressure ] = useState(DEFAULT_PRESSURE);
    const [ dimensions, setDimensions ] = useState({ width: PANEL_WIDTH_MIN, height: PANEL_HEIGHT_MIN });
    const [ strokeColor, setStrokeColor ] = useState<string>(DEFAULT_COLOR);
    const [ isEraserActive, setIsEraserActive ] = useState<boolean>(false);
    const [ scaleFactor, setScaleFactor ] = useState<number>(1);
    const [ triggerRedraw, setTriggerRedraw ] = useState<number>(0);
    const localStrokeHistoryRef = useRef<Point[][]>(localStrokeHistory);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const eraserResolvedColor = theme.palette.background.default;

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
            logger.debug("New Scale Factor:", newScaleFactor);

            // Update state for layout purposes
            setDimensions({ width: newWidth, height: newHeight });
            setScaleFactor(newScaleFactor);
        };

        const debouncedHandleResize = debounce(() => {
            logger.debug("Debounced handle resize");
            handleResize();
        }, 200);

        handleResize();

        window.addEventListener("resize", debouncedHandleResize);

        return () => {
            debouncedHandleResize.cancel();
            window.removeEventListener("resize", debouncedHandleResize);
        };
    }, []);

    // Redraw the canvas whenever dimensions or scaleFactor change
    useEffect(() => {
        setPassEnabled(!!editorActive);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Redraw vectorized points
        strokeHistory?.forEach((strokeArray) =>
            drawOnCanvas(scalePoints(strokeArray, ScaleDirection.TO_DISPLAY, scaleFactor), 0, context, eraserResolvedColor),
        );

        // Clip and add snippet to canvas
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

        // Redraw current additions from local editor
        localStrokeHistoryRef.current?.forEach((strokeArray, index) => {
            drawOnCanvas(scalePoints(strokeArray, ScaleDirection.TO_DISPLAY, scaleFactor), 0, context, eraserResolvedColor);
            logger.debug(`Redrew strokeArray #${index}`);
        });
    }, [ dimensions, scaleFactor, editorActive, passEnabled, triggerRedraw ]);

    function passTurn() {
        emitSendPanel(localStrokeHistory);
        setPoints([]);
        setLocalStrokeHistory([]);
        setPassEnabled(false);
    }

    function completeDrawing() {
        emitSendLastPanel(localStrokeHistory);
        setLocalStrokeHistory([]);
        setIsDrawingComplete(false);
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
                x = touch.pageX - canvasBounds.left - window.scrollX;
                y = touch.pageY - canvasBounds.top - window.scrollY;
                if (allowDirect || (touch && touch.touchType !== "direct")) {
                    if (touch.force && touch.force > 0) {
                        pressure = touch.force;
                        setEventPressure(pressure);
                    }
                }
            } else {
                pressure = 1.0;
                x = e.pageX - canvasBounds.left - window.scrollX;
                y = e.pageY - canvasBounds.top - window.scrollY;
            }

            setCoordinates({ x, y });
            setIsMousedown(true);

            const computedLineWidth = Math.log(pressure + 1) * DEFAULT_LINE_WIDTH * scaleFactor;
            setLineWidth(computedLineWidth);
            const currentColor = isEraserActive
                ? "!e"
                : strokeColor;
            const newPoint = { x, y, lineWidth: computedLineWidth, color: currentColor };
            setPoints((prev) => [ ...prev, newPoint ]);

            drawOnCanvas([ newPoint ], 0, context, eraserResolvedColor);
        },
        [ allowDirect, scaleFactor, strokeColor, isEraserActive ],
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
                    x = touch.pageX - canvasBounds.left - window.scrollX;
                    y = touch.pageY - canvasBounds.top - window.scrollY;
                }
                y = touch.pageY - canvasBounds.top;
            } else {
                pressure = 1.0;
                x = e.pageX - canvasBounds.left - window.scrollX;
                y = e.pageY - canvasBounds.top - window.scrollY;
            }
            setCoordinates({ x, y });

            const computedLineWidth = Math.log(pressure + 1) * DEFAULT_LINE_WIDTH * scaleFactor;
            setLineWidth(computedLineWidth);
            const currentColor = isEraserActive
                ? "!e"
                : strokeColor;
            const newPoint = { x, y, lineWidth: computedLineWidth, color: currentColor };

            setPoints((prev) => {
                const lastPoint = prev[prev.length - 1];
                if (lastPoint) {
                    drawOnCanvas([ lastPoint, newPoint ], 0, context, eraserResolvedColor);
                }
                return [ ...prev, newPoint ];
            });
        },
        [ allowDirect, isMousedown, scaleFactor, strokeColor, isEraserActive ],
    );

    const debouncedEmitPanel = useCallback(
        debounce((currentPanel: Point[][]) => {
            emitSendPanelEdit(currentPanel);
        }, 200),
        [],
    );

    const handleEnd = useCallback(() => {
        setIsMousedown(false);
        const scaledPoints: Point[] = scalePoints(points, ScaleDirection.TO_UNIVERSAL, scaleFactor);
        const currentPanel = [ ...localStrokeHistory, scaledPoints ];
        debouncedEmitPanel(currentPanel);
        setLocalStrokeHistory((prev) => [ ...prev, scaledPoints ]);
        setPoints([]);
        setLineWidth(0);
        setUndidStrokeHistory([]);
    }, [ points, scaleFactor ]);

    const handleUndo = () => {
        if (localStrokeHistory.length === 0) return;

        const lastStroke = localStrokeHistory[localStrokeHistory.length - 1];
        const strokeHistoryMinusLastStroke = localStrokeHistory.slice(0, -1);

        setLocalStrokeHistory(strokeHistoryMinusLastStroke);

        setUndidStrokeHistory([ ...undidStrokeHistory, lastStroke ]);

        debouncedEmitPanel(strokeHistoryMinusLastStroke);
        setTriggerRedraw((prev) => prev += 1);
    };

    const handleRedo = () => {
        if (undidStrokeHistory.length === 0) return;

        const lastUndoneStroke = undidStrokeHistory[undidStrokeHistory.length - 1];
        const updatedLocalStrokeHistory = [ ...localStrokeHistory, lastUndoneStroke ];

        setLocalStrokeHistory(updatedLocalStrokeHistory);
        setUndidStrokeHistory(undidStrokeHistory.slice(0, -1));
        debouncedEmitPanel(updatedLocalStrokeHistory);
        setTriggerRedraw((prev) => prev += 1);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <Button
                disabled={!passEnabled || isDrawingComplete}
                onClick={onLastContribution
                    ? completeDrawing
                    : passTurn}
            >
                {(!editorActive && !passEnabled)
                    ? "Your friend is drawing..."
                    : onLastContribution
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
                    boxShadow: editorActive
                        ? `0 0 8px 4px ${theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.7)"
                            : "rgba(0,0,0,0.7)"}`
                        : undefined,
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
            <div style={{ marginBottom: "10px" }}>
                <Button
                    disabled={!editorActive || isEraserActive}
                    variant={isEraserActive
                        ? "contained"
                        : "outlined"}
                    color="inherit"
                    sx={{ maxHeight: 36.5 }}
                >
                    <input
                        type="color"
                        id="color-picker"
                        value={strokeColor}
                        onChange={(e) => setStrokeColor(e.target.value)}
                        style={{ accentColor: DEFAULT_COLOR }}
                        disabled={isEraserActive}
                    />
                    <label htmlFor="color-picker">&nbsp;&nbsp;Color</label>
                </Button>
                <Button
                    sx={{ minWidth: 202.15 }}
                    disabled={!editorActive}
                    variant={isEraserActive
                        ? "contained"
                        : "outlined"}
                    color={isEraserActive
                        ? "primary"
                        : "inherit"}
                    onClick={() => setIsEraserActive(!isEraserActive)}
                    startIcon={<FormatColorResetIcon />}
                >
                    {isEraserActive
                        ? "Switch to Pen"
                        : "Switch to Eraser"}
                </Button>
                <Button
                    disabled={!editorActive || localStrokeHistory.length === 0}
                    variant={isEraserActive
                        ? "contained"
                        : "outlined"}
                    color={isEraserActive
                        ? "primary"
                        : "inherit"}
                    onClick={() => handleUndo()}
                    startIcon={<UndoIcon />}
                >
                    {"Undo"}
                </Button>
                <Button
                    disabled={!editorActive || undidStrokeHistory.length === 0}
                    // variant="contained"
                    variant={isEraserActive
                        ? "contained"
                        : "outlined"}

                    color={isEraserActive
                        ? "primary"
                        : "inherit"}
                    onClick={() => handleRedo()}
                    startIcon={<RedoIcon />}
                >
                    {"Redo"}
                </Button>
            </div>
        </div>
    );
};

export default Canvas;

