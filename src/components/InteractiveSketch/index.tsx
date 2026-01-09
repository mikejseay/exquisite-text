/**
 * @license
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Converted to TypeScript React component by the project authors.
 * Original demo by David Ha <hadavid@google.com>
 */

import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { SketchRNN } from "@magenta/sketch";

import { AVAILABLE_MODELS, AvailableModel, InteractiveSketchProps, Stroke } from "./types";
import { drawStrokes, setRandomModelColor, useSketchState } from "./useSketchState";
import {
    buttonSx,
    canvasContainer,
    canvasWrapper,
    controlsContainer,
    loadingOverlay,
    selectSx,
    sketchContainer,
    sliderSx,
} from "./styles";

const BASE_URL = "https://storage.googleapis.com/quickdraw-models/sketchRNN/models/";
const DEFAULT_TEMPERATURE = 0.25;
const DEFAULT_PIXEL_FACTOR = 5.0;
const FRAME_RATE = 60;

export const InteractiveSketch: React.FC<InteractiveSketchProps> = ({
    initialModel = "cat",
    initialTemperature = DEFAULT_TEMPERATURE,
    width,
    height,
    pixelFactor = DEFAULT_PIXEL_FACTOR,
    onModelLoaded,
    onClear,
    className,
}) => {
    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const modelRef = useRef<SketchRNN | null>(null);
    const animationFrameRef = useRef<number>(0);
    const lastFrameTimeRef = useRef<number>(0);

    // State
    const [ selectedModel, setSelectedModel ] = useState<AvailableModel>(
        AVAILABLE_MODELS.includes(initialModel as AvailableModel)
            ? (initialModel as AvailableModel)
            : "cat",
    );
    const [ temperature, setTemperature ] = useState<number>(initialTemperature);
    const [ modelLoaded, setModelLoaded ] = useState<boolean>(false);
    const [ canvasSize, setCanvasSize ] = useState<{ width: number; height: number }>({
        width: width || 800,
        height: height || 400,
    });

    // Custom hook for sketch state management
    const {
        stateRef,
        resetState,
        handleMouseDown,
        handleMouseUp,
        handleMouseDrag,
        updateFromModel,
    } = useSketchState();

    /**
     * Get the 2D rendering context from the canvas
     */
    const getContext = useCallback((): CanvasRenderingContext2D | null => {
        return canvasRef.current?.getContext("2d") || null;
    }, []);

    /**
     * Check if coordinates are within canvas bounds
     */
    const isInBounds = useCallback((x: number, y: number): boolean => {
        return x >= 0 && y >= 0 && x <= canvasSize.width && y <= canvasSize.height;
    }, [ canvasSize ]);

    /**
     * Clear the canvas and reset to white background
     */
    const clearCanvas = useCallback(() => {
        const ctx = getContext();
        if (ctx) {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
            ctx.lineWidth = 3.0;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
        }
    }, [ getContext, canvasSize ]);

    /**
     * Encode strokes and initialize RNN state
     */
    const encodeStrokes = useCallback((sequence: Stroke[]) => {
        const model = modelRef.current;
        const state = stateRef.current;

        if (!model || sequence.length <= 5) return;

        // Encode the strokes in the model
        let newState = model.zeroState();
        newState = model.update(model.zeroInput(), newState);
        newState = model.updateStrokes(sequence, newState, sequence.length - 1);

        // Reset the actual model we're using to this one that has the encoded strokes
        state.modelState = model.copyState(newState);

        // Reset the state
        const idx = state.allRawLines.length - 1;
        const lastPoint = state.allRawLines[idx][state.allRawLines[idx].length - 1];
        state.x = lastPoint[0];
        state.y = lastPoint[1];

        const s = sequence[sequence.length - 1];
        state.dx = s[0];
        state.dy = s[1];
        state.previousPen = [ s[2], s[3], s[4] ];

        state.modelIsActive = true;
    }, [ stateRef ]);

    /**
     * Initialize RNN state from strokes and redraw
     */
    const initRNNStateFromStrokes = useCallback((strokes: Stroke[]) => {
        const ctx = getContext();
        const state = stateRef.current;

        // Encode strokes
        encodeStrokes(strokes);

        // Redraw
        if (ctx) {
            clearCanvas();
            drawStrokes(ctx, strokes, state.startX, state.startY);
            setRandomModelColor(ctx);
        }
    }, [ getContext, stateRef, encodeStrokes, clearCanvas ]);

    /**
     * Full restart - clear canvas and reset all state
     */
    const restart = useCallback(() => {
        clearCanvas();
        resetState(canvasSize.width, canvasSize.height);
        onClear?.();
    }, [ clearCanvas, resetState, canvasSize, onClear ]);

    /**
     * Load a SketchRNN model
     */
    const initModel = useCallback(async (modelName: AvailableModel) => {
        setModelLoaded(false);

        // Dispose previous model
        if (modelRef.current) {
            modelRef.current.dispose();
        }

        // Create and load new model
        const model = new SketchRNN(
            `${BASE_URL}${modelName}.gen.json`,
        );
        modelRef.current = model;

        try {
            await model.initialize();
            setModelLoaded(true);
            console.log(`SketchRNN model "${modelName}" loaded.`);

            // Initialize the scale factor for the model
            model.setPixelFactor(pixelFactor);

            // If there are existing strokes, re-encode them
            if (stateRef.current.strokes.length > 0) {
                initRNNStateFromStrokes(stateRef.current.strokes);
            }

            onModelLoaded?.(modelName);
        } catch (error) {
            console.error(`Failed to load model "${modelName}":`, error);
        }
    }, [ pixelFactor, stateRef, initRNNStateFromStrokes, onModelLoaded ]);

    /**
     * Handle model selection change
     */
    const handleModelChange = useCallback((event: SelectChangeEvent<string>) => {
        const newModel = event.target.value as AvailableModel;
        setSelectedModel(newModel);
        initModel(newModel);
    }, [ initModel ]);

    /**
     * Handle temperature slider change
     */
    const handleTemperatureChange = useCallback((_: Event, value: number | number[]) => {
        setTemperature(value as number);
    }, []);

    /**
     * Select a random model
     */
    const handleRandomModel = useCallback(() => {
        const randomIndex = Math.floor(Math.random() * AVAILABLE_MODELS.length);
        const randomModel = AVAILABLE_MODELS[randomIndex];
        setSelectedModel(randomModel);
        initModel(randomModel);
    }, [ initModel ]);

    /**
     * Get mouse/touch position relative to canvas
     */
    const getCanvasPosition = useCallback((
        event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent,
    ): { x: number; y: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        let clientX: number, clientY: number;

        if ("touches" in event) {
            const touch = event.touches[0] || event.changedTouches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    }, []);

    /**
     * Mouse/touch event handlers
     */
    const onPointerDown = useCallback((event: React.MouseEvent | React.TouchEvent) => {
        event.preventDefault();
        const { x, y } = getCanvasPosition(event);
        handleMouseDown(x, y, isInBounds(x, y), getContext());
    }, [ getCanvasPosition, handleMouseDown, isInBounds, getContext ]);

    const onPointerUp = useCallback((event: React.MouseEvent | React.TouchEvent) => {
        event.preventDefault();
        const { x, y } = getCanvasPosition(event);
        handleMouseUp(
            x,
            y,
            isInBounds(x, y),
            modelRef.current,
            initRNNStateFromStrokes,
        );
    }, [ getCanvasPosition, handleMouseUp, isInBounds, initRNNStateFromStrokes ]);

    const onPointerMove = useCallback((event: React.MouseEvent | React.TouchEvent) => {
        event.preventDefault();
        const { x, y } = getCanvasPosition(event);
        handleMouseDrag(x, y, isInBounds(x, y), getContext());
    }, [ getCanvasPosition, handleMouseDrag, isInBounds, getContext ]);

    /**
     * Animation loop for model drawing
     */
    const animate = useCallback((timestamp: number) => {
        const frameInterval = 1000 / FRAME_RATE;

        if (timestamp - lastFrameTimeRef.current >= frameInterval) {
            lastFrameTimeRef.current = timestamp;

            if (modelLoaded && modelRef.current) {
                updateFromModel(
                    modelRef.current,
                    temperature,
                    getContext(),
                    initRNNStateFromStrokes,
                );
            }
        }

        animationFrameRef.current = requestAnimationFrame(animate);
    }, [ modelLoaded, temperature, getContext, updateFromModel, initRNNStateFromStrokes ]);

    /**
     * Initialize canvas size based on container
     */
    useEffect(() => {
        const updateCanvasSize = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.getBoundingClientRect().width;
                setCanvasSize({
                    width: width || Math.floor(containerWidth - 6), // Account for border
                    height: height || Math.floor(window.innerHeight / 2),
                });
            }
        };

        updateCanvasSize();
        window.addEventListener("resize", updateCanvasSize);
        return () => window.removeEventListener("resize", updateCanvasSize);
    }, [ width, height ]);

    /**
     * Initialize canvas and model on mount
     */
    useEffect(() => {
        clearCanvas();
        resetState(canvasSize.width, canvasSize.height);
        initModel(selectedModel);
    }, [ canvasSize ]);

    /**
     * Start animation loop
     */
    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [ animate ]);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            if (modelRef.current) {
                modelRef.current.dispose();
            }
        };
    }, []);

    return (
        <div style={sketchContainer} className={className} ref={containerRef}>
            <Typography variant="h5" gutterBottom>
                Interactive Sketch Prediction
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
                This demo attempts to finish the drawing given whatever strokes you draw
                on the screen. You can also select other classes, like &quot;cat&quot;, &quot;ant&quot;, &quot;bus&quot;, etc.
            </Typography>

            <Box style={controlsContainer}>
                <Select
                    value={selectedModel}
                    onChange={handleModelChange}
                    size="small"
                    sx={selectSx}
                    disabled={!modelLoaded}
                >
                    {AVAILABLE_MODELS.map((model) => (
                        <MenuItem key={model} value={model}>
                            {model}
                        </MenuItem>
                    ))}
                </Select>

                <Button
                    onClick={restart}
                    sx={buttonSx}
                    disabled={!modelLoaded}
                >
                    Clear Drawing
                </Button>

                <Button
                    onClick={handleRandomModel}
                    sx={buttonSx}
                    disabled={!modelLoaded}
                >
                    Random
                </Button>

                <Box style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
                    <Typography variant="body2">Temperature:</Typography>
                    <Slider
                        value={temperature}
                        onChange={handleTemperatureChange}
                        min={0}
                        max={1}
                        step={0.05}
                        sx={sliderSx}
                        disabled={!modelLoaded}
                    />
                    <Typography variant="body2" fontWeight="bold" sx={{ minWidth: "40px" }}>
                        {temperature.toFixed(2)}
                    </Typography>
                </Box>
            </Box>

            <Box style={canvasWrapper}>
                <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    style={canvasContainer}
                    onMouseDown={onPointerDown}
                    onMouseUp={onPointerUp}
                    onMouseMove={onPointerMove}
                    onMouseLeave={onPointerUp}
                    onTouchStart={onPointerDown}
                    onTouchEnd={onPointerUp}
                    onTouchMove={onPointerMove}
                />
                {!modelLoaded && (
                    <Box style={loadingOverlay}>
                        <CircularProgress />
                        <Typography variant="body1" sx={{ ml: 2 }}>
                            Loading model...
                        </Typography>
                    </Box>
                )}
            </Box>
        </div>
    );
};

export default InteractiveSketch;
