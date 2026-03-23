// src/screens/Canvas/index.tsx

import DoneIcon from "@mui/icons-material/Done";
import FormatColorResetIcon from "@mui/icons-material/FormatColorReset";
import MoveUpIcon from "@mui/icons-material/MoveUp";
import PaletteIcon from "@mui/icons-material/Palette";
import RedoIcon from "@mui/icons-material/Redo";
import UndoIcon from "@mui/icons-material/Undo";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import { useTheme } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import { useSocketInfo } from "context/SocketInfoProvider";
import { emitSendLastPanel, emitSendPanel, emitSendPanelEdit } from "context/SocketRequestors";
import { debounce } from "helpers/helpers";
import { useCanvasResize } from "hooks/useCanvasResize";
import { useDisableScroll } from "hooks/useDisableScroll";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Point } from "types/types";
import { DEFAULT_COLOR, drawOnCanvas } from "utilities/canvasUtils";
import { logger } from "utilities/loggerUtils";
import { pixelRatio, ScaleDirection, scalePoints } from "utilities/scaleUtils";

type PointerLikeEvent = {
    clientX: number;
    clientY: number;
    pressure?: number;
    pointerType?: string;
};

const DEFAULT_LINE_WIDTH = 8;
export const OVERLAP = 0.2;
const DEFAULT_PRESSURE = 0.5;
const MAX_LINE_WIDTH_VIA_SLIDER = 20;

export const PANEL_HEIGHT_MIN = 300; // retina is double
export const PANEL_WIDTH_MIN = 667;
// 2.23
export const PANEL_ASPECT_RATIO = PANEL_WIDTH_MIN / PANEL_HEIGHT_MIN;
// 780 px
export const DRAWING_HEIGHT_MIN = (3 - 2 * OVERLAP) * PANEL_HEIGHT_MIN;
export const DRAWING_WIDTH_MIN = PANEL_WIDTH_MIN;
// 0.86
export const DRAWING_ASPECT_RATIO = DRAWING_WIDTH_MIN / DRAWING_HEIGHT_MIN;

function getPointViaPointerEvent(
    event: PointerLikeEvent,
    canvas: HTMLCanvasElement,
    baseLineWidth: number,
    scaleFactor: number,
    isEraserActive: boolean,
    strokeColor: string,
) {
    const canvasBounds = canvas.getBoundingClientRect();
    const x = event.clientX - canvasBounds.left;
    const y = event.clientY - canvasBounds.top;

    const rawPressure = typeof event.pressure === "number" ? event.pressure : DEFAULT_PRESSURE;

    const pressure = rawPressure > 0 ? rawPressure : DEFAULT_PRESSURE;

    // Normalize pressure by input type: finger/touch reports flat ~0.5 while
    // Apple Pencil reports analog 0.01-1.0, so use a fixed multiplier for touch
    // to keep line width consistent when switching between input types
    const pressureMultiplier = event.pointerType === "touch" ? DEFAULT_PRESSURE : pressure;

    const lineWidth = Math.log(pressureMultiplier + 1) * baseLineWidth * scaleFactor;
    const color = isEraserActive ? "!e" : strokeColor;

    return { x, y, lineWidth, color };
}

const Canvas: React.FC = () => {
    const theme = useTheme();
    const { strokeHistory, editorActive, onLastContribution } = useSocketInfo();
    const toolbarRef = useRef<HTMLDivElement>(null);
    const colorInputRef = useRef<HTMLInputElement>(null);
    const { canvasRef, dimensions, scaleFactor } = useCanvasResize(
        PANEL_WIDTH_MIN,
        PANEL_HEIGHT_MIN,
        PANEL_ASPECT_RATIO,
        toolbarRef,
    );
    const [points, setPoints] = useState<Point[]>([]);
    const [localStrokeHistory, setLocalStrokeHistory] = useState<Point[][]>([]);
    const [undidStrokeHistory, setUndidStrokeHistory] = useState<Point[][]>([]);
    const [isMousedown, setIsMousedown] = useState(false);
    const [_passEnabled, setPassEnabled] = useState(false);
    const [strokeColor, setStrokeColor] = useState<string>(DEFAULT_COLOR);
    const [isEraserActive, setIsEraserActive] = useState<boolean>(false);
    const [_triggerRedraw, setTriggerRedraw] = useState<number>(0);
    const [baseLineWidth, setBaseLineWidth] = useState<number>(DEFAULT_LINE_WIDTH);
    logger.debug(theme.palette.text);
    const localStrokeHistoryRef = useRef<Point[][]>(localStrokeHistory);

    useEffect(() => {
        localStrokeHistoryRef.current = localStrokeHistory;
    }, [localStrokeHistory]);

    useDisableScroll();

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
                eraserColor: theme.palette.canvas.background,
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
        context.clearRect(context.canvas.width, context.canvas.height * OVERLAP, 0, context.canvas.height);

        // Redraw current additions from local editor
        localStrokeHistoryRef.current?.forEach((strokeArray, index) => {
            drawOnCanvas({
                newPoints: scalePoints(strokeArray, ScaleDirection.TO_DISPLAY, scaleFactor),
                yOffset: 0,
                context,
                eraserColor: theme.palette.canvas.background,
            }),
                logger.debug(`Redrew strokeArray #${index}`);
        });
    }, [scaleFactor, editorActive, strokeHistory, canvasRef.current, theme.palette.canvas.background]);

    function passTurn() {
        emitSendPanel(localStrokeHistory);
        setPoints([]);
        setLocalStrokeHistory([]);
        setPassEnabled(false);
    }

    function completeDrawing() {
        emitSendLastPanel(localStrokeHistory);
        setLocalStrokeHistory([]);
    }

    const debouncedEmitPanel = useCallback(
        debounce((currentPanel: Point[][]) => {
            emitSendPanelEdit(currentPanel);
        }, 200),
        [],
    );

    const handleEnd = useCallback(() => {
        setIsMousedown(false);
        const scaledPoints: Point[] = scalePoints(points, ScaleDirection.TO_UNIVERSAL, scaleFactor);
        const currentPanel = [...localStrokeHistory, scaledPoints];
        debouncedEmitPanel(currentPanel);
        setLocalStrokeHistory((prev) => [...prev, scaledPoints]);
        setPoints([]);
        setUndidStrokeHistory([]);
    }, [points, scaleFactor, debouncedEmitPanel, localStrokeHistory]);

    const handlePointerStart = useCallback(
        (e: React.PointerEvent<HTMLCanvasElement>) => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const context = canvas.getContext("2d", { willReadFrequently: true });
            if (!context) return;

            canvas.setPointerCapture(e.pointerId);

            setIsMousedown(true);

            const newPoint = getPointViaPointerEvent(
                e,
                canvas,
                baseLineWidth,
                scaleFactor,
                isEraserActive,
                strokeColor,
            );

            setPoints((prev) => [...prev, newPoint]);

            drawOnCanvas({
                newPoints: [newPoint],
                yOffset: 0,
                context,
                eraserColor: theme.palette.canvas.background,
            });
        },
        [scaleFactor, strokeColor, isEraserActive, baseLineWidth, canvasRef.current, theme.palette.canvas.background],
    );

    const handlePointerMove = useCallback(
        (e: React.PointerEvent<HTMLCanvasElement>) => {
            if (!isMousedown) return;

            const canvas = canvasRef.current;
            if (!canvas) return;

            const context = canvas.getContext("2d", { willReadFrequently: true });
            if (!context) return;

            const newPoint = getPointViaPointerEvent(
                e,
                canvas,
                baseLineWidth,
                scaleFactor,
                isEraserActive,
                strokeColor,
            );

            setPoints((prev) => {
                const lastPoint = prev[prev.length - 1];
                if (lastPoint) {
                    drawOnCanvas({
                        newPoints: [lastPoint, newPoint],
                        yOffset: 0,
                        context,
                        eraserColor: theme.palette.canvas.background,
                    });
                }
                return [...prev, newPoint];
            });
        },
        [
            isMousedown,
            scaleFactor,
            strokeColor,
            isEraserActive,
            baseLineWidth,
            canvasRef.current,
            theme.palette.canvas.background,
        ],
    );

    const handlePointerEnd = useCallback(
        (e: React.PointerEvent<HTMLCanvasElement>) => {
            const canvas = canvasRef.current;
            if (canvas) {
                try {
                    canvas.releasePointerCapture(e.pointerId);
                } catch {
                    // ignore if not captured
                }
            }

            handleEnd();
        },
        [handleEnd, canvasRef.current],
    );

    const handleUndo = () => {
        if (localStrokeHistory.length === 0) return;

        const lastStroke = localStrokeHistory[localStrokeHistory.length - 1];
        const strokeHistoryMinusLastStroke = localStrokeHistory.slice(0, -1);

        setLocalStrokeHistory(strokeHistoryMinusLastStroke);
        setUndidStrokeHistory([...undidStrokeHistory, lastStroke]);
        debouncedEmitPanel(strokeHistoryMinusLastStroke);
        setTriggerRedraw((prev) => (prev += 1));
    };

    const handleRedo = () => {
        if (undidStrokeHistory.length === 0) return;

        const lastUndoneStroke = undidStrokeHistory[undidStrokeHistory.length - 1];
        const updatedLocalStrokeHistory = [...localStrokeHistory, lastUndoneStroke];

        setLocalStrokeHistory(updatedLocalStrokeHistory);
        setUndidStrokeHistory(undidStrokeHistory.slice(0, -1));
        debouncedEmitPanel(updatedLocalStrokeHistory);
        setTriggerRedraw((prev) => (prev += 1));
    };

    return (
        <>
            <div
                ref={toolbarRef}
                className="canvas-toolbar"
                style={{
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: theme.spacing(1),
                    marginBottom: theme.spacing(1),
                }}
            >
                <Tooltip title="Undo" enterTouchDelay={0} leaveTouchDelay={1500}>
                    <span>
                        <IconButton onClick={handleUndo} disabled={!editorActive || localStrokeHistory.length === 0}>
                            <UndoIcon />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Redo" enterTouchDelay={0} leaveTouchDelay={1500}>
                    <span>
                        <IconButton onClick={handleRedo} disabled={!editorActive || undidStrokeHistory.length === 0}>
                            <RedoIcon />
                        </IconButton>
                    </span>
                </Tooltip>
                <Divider
                    orientation="vertical"
                    sx={{
                        height: 28,
                        alignSelf: "center",
                        backgroundColor: theme.palette.divider,
                        marginLeft: theme.spacing(0.5),
                        marginRight: theme.spacing(1.5),
                    }}
                />
                {/* Other controls */}
                <Tooltip title="Pick Line Width" enterTouchDelay={0} leaveTouchDelay={1500}>
                    <Slider
                        value={baseLineWidth}
                        onChange={(_, v) => setBaseLineWidth(v as number)}
                        step={1}
                        min={1}
                        max={MAX_LINE_WIDTH_VIA_SLIDER}
                        valueLabelDisplay="auto"
                        disabled={!editorActive}
                        sx={{
                            marginRight: theme.spacing(2.75),
                            width: "clamp(60px, 20vw, 120px)",
                            cursor: "ew-resize",
                            color: strokeColor,
                            "& .MuiSlider-rail": {
                                opacity: 0.3,
                                bgcolor: strokeColor,
                                boxShadow: "0 0 4px 4px rgba(0, 0, 0, 0.7)",
                            },
                            "& .MuiSlider-thumb": {
                                width: `${baseLineWidth}px`,
                                height: `${baseLineWidth}px`,
                                bgcolor: strokeColor,
                                border: "2px solid white",
                                "&:hover, &.Mui-focusVisible": {
                                    boxShadow: "0 0 4px 2px rgba(0, 0, 0, 0.7)",
                                },
                                "&:active": {
                                    boxShadow: "0 0 4px 2px rgba(0, 0, 0, 0.7)",
                                },
                                cursor: "ew-resize",
                            },
                        }}
                    />
                </Tooltip>
                <Tooltip title="Pick Color" enterTouchDelay={0} leaveTouchDelay={1500}>
                    <span style={{ position: "relative", display: "inline-flex" }}>
                        <IconButton disabled={!editorActive || isEraserActive} component="span">
                            <PaletteIcon />
                        </IconButton>
                        <input
                            ref={colorInputRef}
                            type="color"
                            value={strokeColor}
                            onChange={(e) => setStrokeColor(e.target.value)}
                            disabled={!editorActive || isEraserActive}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                opacity: 0,
                                cursor: "pointer",
                                border: "none",
                                padding: 0,
                            }}
                        />
                    </span>
                </Tooltip>
                <Tooltip
                    title={isEraserActive ? "Switch to Pen" : "Switch to Eraser"}
                    enterTouchDelay={0}
                    leaveTouchDelay={1500}
                >
                    <span>
                        <IconButton
                            onClick={() => setIsEraserActive((prev) => !prev)}
                            disabled={!editorActive}
                            color={isEraserActive ? "primary" : "default"}
                        >
                            <FormatColorResetIcon />
                        </IconButton>
                    </span>
                </Tooltip>
                <Divider
                    orientation="vertical"
                    sx={{
                        height: 28,
                        alignSelf: "center",
                        backgroundColor: theme.palette.divider,
                        marginLeft: theme.spacing(0.5),
                        marginRight: theme.spacing(2),
                    }}
                />
                <Tooltip
                    title={onLastContribution ? "Complete Drawing" : "Pass"}
                    enterTouchDelay={0}
                    leaveTouchDelay={1500}
                >
                    <span>
                        <Button
                            variant="contained"
                            tabIndex={-1}
                            startIcon={onLastContribution ? <DoneIcon /> : <MoveUpIcon />}
                            onClick={onLastContribution ? completeDrawing : passTurn}
                        >
                            {onLastContribution ? "Done" : "Pass"}
                        </Button>
                    </span>
                </Tooltip>
            </div>
            <div
                className="canvas-container"
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    paddingLeft: theme.spacing(2),
                    overflow: "visible",
                    position: "relative",
                }}
            >
                {!editorActive && (
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            zIndex: 1,
                            textAlign: "center",
                            color: theme.palette.text.primary,
                            pointerEvents: "none",
                        }}
                    >
                        Waiting for other players...
                    </div>
                )}
                <canvas
                    ref={canvasRef}
                    width={dimensions.width * pixelRatio}
                    height={dimensions.height * pixelRatio}
                    style={{
                        width: `${dimensions.width}px`,
                        height: `${dimensions.height}px`,
                        border: "1px solid black",
                        backgroundColor: theme.palette.canvas.background,
                        display: "block",
                        pointerEvents: editorActive ? "auto" : "none",
                        opacity: editorActive ? 1 : 0.5,
                        boxShadow: editorActive ? `0 0 8px 4px ${theme.palette.canvas.boxShadow}` : undefined,
                        touchAction: "none",
                    }}
                    onPointerDown={handlePointerStart}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerEnd}
                    onPointerCancel={handlePointerEnd}
                />
            </div>
        </>
    );
};

export default Canvas;
