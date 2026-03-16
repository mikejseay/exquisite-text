// src/components/CompletedDrawings/index.tsx
import React, { useEffect, useRef } from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { useTheme } from "@mui/material/styles";

import {
    DRAWING_ASPECT_RATIO,
    DRAWING_HEIGHT_MIN,
    DRAWING_WIDTH_MIN,
    OVERLAP,
    PANEL_HEIGHT_MIN,
} from "../../screens/Canvas";
import { Point } from "../../types";
import { drawOnCanvas } from "../../utilities/canvasUtils";
import { useCanvasResize } from "../../hooks/useCanvasResize";
import { ScaleDirection, pixelRatio, scalePoints } from "../../utilities/scaleUtils";


export const CompletedDrawing = ({
    completedDrawing,
    shouldAnimate,
}: {
    completedDrawing: Point[][][];
    shouldAnimate: boolean;
}): JSX.Element | null => {
    const theme = useTheme();
    const { canvasRef, dimensions, scaleFactor } = useCanvasResize(DRAWING_WIDTH_MIN, DRAWING_HEIGHT_MIN, DRAWING_ASPECT_RATIO);
    const animationRef = useRef<number>();

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
                if (animationRef.current && panelIndex >= totalPanels) {
                    cancelAnimationFrame(animationRef.current);
                    return;
                }

                const strokeHistory = completedDrawing[panelIndex];
                const strokeArray = scalePoints(
                    strokeHistory[strokeHistoryIndex],
                    ScaleDirection.TO_DISPLAY,
                    scaleFactor,
                );

                if (strokeArray) {
                    drawOnCanvas({
                        newPoints: strokeArray,
                        yOffset,
                        context,
                        eraserColor: theme.palette.canvas.background,
                    });
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
                    drawOnCanvas({
                        newPoints: scalePoints(strokeArray, ScaleDirection.TO_DISPLAY, scaleFactor),
                        yOffset,
                        context,
                        eraserColor: theme.palette.canvas.background,
                    });
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
                    backgroundColor: theme.palette.canvas.background,
                    boxShadow: `0 0 8px 4px ${theme.palette.canvas.boxShadow}`,
                    display: "block",
                    pointerEvents: "none",
                    marginLeft: "auto",
                    marginRight: "auto",
                }}
            >
                Sorry, your browser is too old for this demo.
            </canvas>
        </div>
    );
};
