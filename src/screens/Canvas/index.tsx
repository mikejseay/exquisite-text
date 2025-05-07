// src/screens/Canvas/index.tsx
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import Slider from "@mui/material/Slider";
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
    * In highly-portrait viewport situations, the line width slider overflows out of view to the left
    * On iPad, the default line width of using your finger after using pencil is extremely small,
        but a single dot is very large
    * End screen aspect ratio not getting set up correctly for small macbook / iPad screen in landscape
    * "How to play" modal for the drawing version of the game?
    * Fix bug where user changes system theme it disconnects them and they have to refresh browser
    * General code quality
    * One player two drawings, it should alternate between drawings
    * Two players two drawings, one drawing is complete, player gets no visual feedback that
        they're waiting on the other player
    * Spectator view currently defaults to carousel, but if enough real estate is available
        We could consider laying them out as two columns
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
// 2.23
export const PANEL_ASPECT_RATIO = PANEL_WIDTH_MIN / PANEL_HEIGHT_MIN;
// 780 px
export const DRAWING_HEIGHT_MIN = (3 - 2 * OVERLAP) * PANEL_HEIGHT_MIN;
export const DRAWING_WIDTH_MIN = PANEL_WIDTH_MIN;
// 0.86
export const DRAWING_ASPECT_RATIO = DRAWING_WIDTH_MIN / DRAWING_HEIGHT_MIN;

const Canvas: React.FC = () => {
    const theme = useTheme();
    const { strokeHistory, editorActive, onLastContribution } = useSocketInfo();
    const [ isDrawingComplete, setIsDrawingComplete ] = useState(false);
    const [ points, setPoints ] = useState<Point[]>([]);
    const [ localStrokeHistory, setLocalStrokeHistory ] = useState<Point[][]>([]);
    const [ undidStrokeHistory, setUndidStrokeHistory ] = useState<Point[][]>([]);
    const [ isMousedown, setIsMousedown ] = useState(false);
    const [ passEnabled, setPassEnabled ] = useState(false);
    const [ dimensions, setDimensions ] = useState({ width: PANEL_WIDTH_MIN, height: PANEL_HEIGHT_MIN });
    const [ strokeColor, setStrokeColor ] = useState<string>(DEFAULT_COLOR);
    const [ isEraserActive, setIsEraserActive ] = useState<boolean>(false);
    const [ scaleFactor, setScaleFactor ] = useState<number>(1);
    const [ triggerRedraw, setTriggerRedraw ] = useState<number>(0);
    const [ baseLineWidth, setBaseLineWidth ] = useState<number>(DEFAULT_LINE_WIDTH);
    const [ shouldShowLineWidthSlider, setShouldShowLineWidthSlider ] = useState<boolean>(false);

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
            // Warning in browser log regarding willReadFrequently went away after adding as true
            const context = canvas.getContext("2d", { willReadFrequently: true });
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
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return;

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Redraw vectorized points
        strokeHistory?.forEach((strokeArray) =>
            drawOnCanvas({
                newPoints: scalePoints(strokeArray, ScaleDirection.TO_DISPLAY, scaleFactor),
                yOffset: 0,
                context,
                eraserColor: theme.palette.canvasBackground,
            }),
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
            drawOnCanvas({
                newPoints: scalePoints(strokeArray, ScaleDirection.TO_DISPLAY, scaleFactor),
                yOffset: 0,
                context,
                eraserColor: theme.palette.canvasBackground,
            }),
            logger.debug(`Redrew strokeArray #${index}`);
        });
    }, [ dimensions, scaleFactor, editorActive, passEnabled, triggerRedraw, strokeHistory ]);

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
            let pressure = 0;
            let x = 0;
            let y = 0;

            const canvas = canvasRef.current;
            if (!canvas) return;
            const context = canvas.getContext("2d", { willReadFrequently: true });
            if (!context) return;

            const canvasBounds = canvas.getBoundingClientRect();
            const isTouch = "touches" in e;

            if (isTouch) {
                const touch = e.touches[0] as ExtendedTouch;
                x = touch.pageX - canvasBounds.left - window.scrollX;
                y = touch.pageY - canvasBounds.top - window.scrollY;
                if (touch && touch.touchType !== "direct") {
                    if (touch.force && touch.force > 0) {
                        pressure = touch.force;
                    }
                }
            } else {
                // For mouse events, override with the custom line width
                x = e.pageX - canvasBounds.left - window.scrollX;
                y = e.pageY - canvasBounds.top - window.scrollY;
            }

            setIsMousedown(true);

            // Calculate line width:
            // Use pressure for touch events; otherwise use the user-adjusted customLineWidth.
            const computedLineWidth = isTouch
                ? Math.log(pressure + 1) * baseLineWidth * scaleFactor
                : baseLineWidth * scaleFactor;
            const currentColor = isEraserActive
                ? "!e"
                : strokeColor;
            const newPoint = { x, y, lineWidth: computedLineWidth, color: currentColor };
            setPoints((prev) => [ ...prev, newPoint ]);

            drawOnCanvas({
                newPoints: [ newPoint ],
                yOffset: 0,
                context,
                eraserColor: theme.palette.canvasBackground,
            });
        },
        [ scaleFactor, strokeColor, isEraserActive, baseLineWidth ],
    );

    const handleMove = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            if (!isMousedown) return;
            e.preventDefault();

            let pressure = 0;
            let x = 0;
            let y = 0;

            const canvas = canvasRef.current;
            if (!canvas) return;
            const context = canvas.getContext("2d", { willReadFrequently: true });
            if (!context) return;

            const canvasBounds = canvas.getBoundingClientRect();
            const isTouch = "touches" in e;

            if (isTouch) {
                const touch = e.touches[0] as ExtendedTouch;
                if (touch && touch.touchType !== "direct") {
                    if (touch.force && touch.force > 0) {
                        pressure = touch.force;
                    }
                    x = touch.pageX - canvasBounds.left - window.scrollX;
                    y = touch.pageY - canvasBounds.top - window.scrollY;
                }
                y = touch.pageY - canvasBounds.top;
            } else {
                x = e.pageX - canvasBounds.left - window.scrollX;
                y = e.pageY - canvasBounds.top - window.scrollY;
            }

            const computedLineWidth = isTouch
                ? Math.log(pressure + 1) * baseLineWidth * scaleFactor
                : baseLineWidth * scaleFactor;
            const currentColor = isEraserActive
                ? "!e"
                : strokeColor;
            const newPoint = { x, y, lineWidth: computedLineWidth, color: currentColor };

            setPoints((prev) => {
                const lastPoint = prev[prev.length - 1];
                if (lastPoint) {
                    drawOnCanvas({
                        newPoints: [ lastPoint, newPoint ],
                        yOffset: 0,
                        context,
                        eraserColor: theme.palette.canvasBackground,
                    });
                }
                return [ ...prev, newPoint ];
            });
        },
        [ isMousedown, scaleFactor, strokeColor, isEraserActive, baseLineWidth ],
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
        setUndidStrokeHistory([]);
    }, [ points, scaleFactor ]);

    const handleUndo = () => {
        if (localStrokeHistory.length === 0) return;

        const lastStroke = localStrokeHistory[localStrokeHistory.length - 1];
        const strokeHistoryMinusLastStroke = localStrokeHistory.slice(0, -1);

        setLocalStrokeHistory(strokeHistoryMinusLastStroke);
        setUndidStrokeHistory([ ...undidStrokeHistory, lastStroke ]);
        debouncedEmitPanel(strokeHistoryMinusLastStroke);
        setTriggerRedraw((prev) => (prev += 1));
    };

    const handleRedo = () => {
        if (undidStrokeHistory.length === 0) return;

        const lastUndoneStroke = undidStrokeHistory[undidStrokeHistory.length - 1];
        const updatedLocalStrokeHistory = [ ...localStrokeHistory, lastUndoneStroke ];

        setLocalStrokeHistory(updatedLocalStrokeHistory);
        setUndidStrokeHistory(undidStrokeHistory.slice(0, -1));
        debouncedEmitPanel(updatedLocalStrokeHistory);
        setTriggerRedraw((prev) => (prev += 1));
    };

    return (
        <div className={"canvas-plus-controls"} style={{ display: "flex", flexDirection: "column" }}>
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
                    backgroundColor: theme.palette.canvasBackground,
                    display: "block",
                    pointerEvents: editorActive
                        ? "auto"
                        : "none",
                    opacity: editorActive
                        ? 1
                        : 0.5,
                    boxShadow: editorActive
                        ? `0 0 8px 4px ${theme.palette.canvasBoxShadow}`
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

            <div
                className={"canvas-control-container"}
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "0.5rem",
                    margin: "0.625rem 0",
                }}
            >
                <div className={"line-width-control"} style={{ position: "relative", display: "inline-block" }}>
                    <Button
                        disabled={!editorActive}
                        variant="contained"
                        color="inherit"
                        onClick={() => setShouldShowLineWidthSlider(!shouldShowLineWidthSlider)}
                        sx={{ minWidth: 146, maxHeight: "2.3rem" }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div
                                style={{
                                    width: `${baseLineWidth}px`,
                                    height: `${baseLineWidth}px`,
                                    borderRadius: "50%",
                                    backgroundColor: theme.palette.text.primary,
                                }}
                            />
                            <span>Line Width</span>
                        </div>
                    </Button>
                    {shouldShowLineWidthSlider && (
                        <div style={{
                            position: "absolute",
                            right: "100%",
                            top: "50%",
                            transform: "translateY(-40%)",
                            width: "12.5rem",
                            marginRight: "0.5rem",
                        }}>
                            <Slider
                                value={baseLineWidth}
                                onChange={(e, value) => setBaseLineWidth(value as number)}
                                step={1}
                                min={1}
                                max={20}
                                valueLabelDisplay="auto"
                            />
                        </div>
                    )}
                </div>
                <Button
                    disabled={!editorActive || isEraserActive}
                    variant="contained"
                    color="inherit"
                    sx={{ maxHeight: "2.3rem" }}
                >
                    <input
                        type="color"
                        id="color-picker"
                        value={strokeColor}
                        onChange={(e) => setStrokeColor(e.target.value)}
                        style={{ accentColor: DEFAULT_COLOR, cursor: "pointer" }}
                        disabled={isEraserActive}
                    />
                    <label htmlFor="color-picker" style={{ cursor: "pointer" }}>
                        &nbsp;&nbsp;Color
                    </label>
                </Button>
                <Button
                    sx={{ minWidth: "12.635rem" }}
                    disabled={!editorActive}
                    variant="contained"
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
                    variant="contained"
                    color={isEraserActive
                        ? "primary"
                        : "inherit"}
                    onClick={handleUndo}
                    startIcon={<UndoIcon />}
                >
                Undo
                </Button>
                <Button
                    disabled={!editorActive || undidStrokeHistory.length === 0}
                    variant="contained"
                    color={isEraserActive
                        ? "primary"
                        : "inherit"}
                    onClick={handleRedo}
                    startIcon={<RedoIcon />}
                >
                Redo
                </Button>
            </div>
        </div>
    );
};

export default Canvas;
