// src/components/CompletedDrawings/index.tsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { debounce } from "es-toolkit";
import { useTheme } from "@mui/material/styles";

import { logger } from "../../utilities/loggerUtils";
import {
    DRAWING_ASPECT_RATIO,
    DRAWING_HEIGHT_MIN,
    DRAWING_WIDTH_MIN,
    OVERLAP,
    PANEL_HEIGHT_MIN,
} from "../../screens/Canvas";
import { Point } from "../../types";
import { drawOnCanvas } from "../../utilities/canvasUtils";
import { useDisableScroll } from "../../hooks/useDisableScroll";
import { ScaleDirection, pixelRatio, scalePoints } from "../../utilities/scaleUtils";
import { aboveCanvasHeight } from "../../constants";


export const CompletedDrawing = ({
    completedDrawing,
    shouldAnimate,
}: {
    completedDrawing: Point[][][];
    shouldAnimate: boolean;
}): JSX.Element | null => {
    const theme = useTheme();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationRef = useRef<number>();
    const [ dimensions, setDimensions ] = useState({ width: DRAWING_WIDTH_MIN, height: DRAWING_HEIGHT_MIN });
    const [ scaleFactor, setScaleFactor ] = useState<number>(1);

    useDisableScroll();

    // Handle resizing of the window // mostly matches useLayoutEffect in Canvas/index.tsx
    useLayoutEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const context = canvas.getContext("2d");
            if (!context) return;

            // TODO: bump this logic up to the singular parent component
            // Calculate new dimensions
            const viewportHeight = window.innerHeight - aboveCanvasHeight;
            const viewportWidth = window.innerWidth;
            const viewportAspectRatio = viewportWidth / viewportHeight;
            let newWidth: number;
            let newHeight: number;

            // Viewport more portrait than drawing
            if (viewportAspectRatio < DRAWING_ASPECT_RATIO) {
                logger.debug("viewportAspectRatio < DRAWING_ASPECT_RATIO");
                newWidth = Math.max(viewportWidth, DRAWING_WIDTH_MIN);
                newHeight = Math.max(newWidth / DRAWING_ASPECT_RATIO, DRAWING_HEIGHT_MIN);
                logger.debug({ viewportWidth, DRAWING_WIDTH_MIN });
                logger.debug("Math.max(viewportWidth, DRAWING_WIDTH_MIN)", Math.max(viewportWidth, DRAWING_WIDTH_MIN),
                );
                logger.debug({ newWidth, DRAWING_ASPECT_RATIO, DRAWING_HEIGHT_MIN });
                logger.debug("Math.max(newWidth / DRAWING_ASPECT_RATIO, DRAWING_HEIGHT_MIN)", Math.max(newWidth / DRAWING_ASPECT_RATIO, DRAWING_HEIGHT_MIN),
                );
            // Viewport more landscape than drawing
            } else {
                logger.debug("else");
                newHeight = Math.max(viewportHeight, DRAWING_HEIGHT_MIN);
                newWidth = Math.max(newHeight * DRAWING_ASPECT_RATIO, DRAWING_WIDTH_MIN);
                logger.debug({ viewportHeight, DRAWING_HEIGHT_MIN, newHeight, DRAWING_ASPECT_RATIO, DRAWING_WIDTH_MIN });
                logger.debug({ newWidth });
            }

            const newScaleFactor = newWidth / DRAWING_WIDTH_MIN;
            logger.debug({ viewportHeight, viewportWidth, viewportAspectRatio, newWidth, newHeight });
            logger.debug("New Scale Factor:", newScaleFactor);

            // Update state for layout purposes
            setDimensions({ width: newWidth, height: newHeight });
            setScaleFactor(newScaleFactor);
        };

        const debouncedHandleResize = debounce(() => {
            logger.debug("Debounced handle resize");
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

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        context.clearRect(0, 0, canvas.width, canvas.height);

        if (shouldAnimate) {
            let panelIndex = 0;
            let strokeHistoryIndex = 0;
            let yOffset = 0;

            const totalPanels = completedDrawing.length;

            const draw = () => {
                if (panelIndex >= totalPanels) {
                    cancelAnimationFrame(animationRef.current!);
                    return;
                }

                const strokeHistory = completedDrawing[panelIndex];
                const strokeArray = scalePoints(
                    strokeHistory[strokeHistoryIndex],
                    ScaleDirection.TO_DISPLAY,
                    scaleFactor,
                );

                if (strokeArray) {
                    drawOnCanvas(strokeArray, yOffset, context, theme.palette.canvasBackground);
                    strokeHistoryIndex += 1;
                } else {
                    panelIndex += 1;
                    strokeHistoryIndex = 0;
                    // NOT SURE THIS MATH IS RIGHT:
                    // top header is 108px
                    yOffset += PANEL_HEIGHT_MIN * scaleFactor * (1 - OVERLAP);
                }

                animationRef.current = requestAnimationFrame(draw);
            };

            draw();

            return () => {
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
            };
        } else {
            let yOffset = 0;
            completedDrawing.forEach((strokeHistory) => {
                strokeHistory.forEach((strokeArray) => {
                    drawOnCanvas(
                        scalePoints(strokeArray, ScaleDirection.TO_DISPLAY, scaleFactor),
                        yOffset,
                        context,
                        theme.palette.canvasBackground,
                    );
                });
                yOffset += PANEL_HEIGHT_MIN * scaleFactor * (1 - OVERLAP);
            });
        }
    }, [ completedDrawing, shouldAnimate, dimensions, scaleFactor ]);

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <canvas
                ref={canvasRef}
                width={dimensions.width * pixelRatio}
                height={dimensions.height * pixelRatio}
                style={{
                    width: `${dimensions.width}px`,
                    height: `${dimensions.height}px`,
                    border: "1px solid black",
                    display: "block",
                    pointerEvents: "none",
                    opacity: 1,
                    marginLeft: "auto",
                    marginRight: "auto",
                }}
            >
                Sorry, your browser is too old for this demo.
            </canvas>
        </div>
    );
};
