// src/components/MultipleDrawings/index.tsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { debounce } from "es-toolkit";
import {
    DRAWING_ASPECT_RATIO,
    DRAWING_HEIGHT_MIN,
    DRAWING_WIDTH_MIN,
    OVERLAP,
    PANEL_HEIGHT_MIN,
} from "../../screens/Canvas";
import { title } from "./styles";
import { Point } from "../../types";
import { drawOnCanvas } from "../../utils/canvasUtils";
import { useDisableScroll } from "../../hooks/useDisableScroll";
import { ScaleDirection, pixelRatio, scalePoints } from "../../utils/scaleUtils";
import { aboveCanvasHeight } from "../../constants";


export const CompletedDrawing = ({
    completedDrawing,
    shouldAnimate,
}: {
    completedDrawing: Point[][][];
    shouldAnimate: boolean;
}): JSX.Element | null => {
    if (completedDrawing?.length === 0) {
        return null;
    }

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

            // Calculate new dimensions
            const viewportHeight = window.innerHeight - aboveCanvasHeight;
            const viewportWidth = window.innerWidth;
            const viewportAspectRatio = viewportWidth / viewportHeight;
            let newWidth: number;
            let newHeight: number;

            // Viewport more portrait than drawing
            if (viewportAspectRatio < DRAWING_ASPECT_RATIO) {
                console.log("viewportAspectRatio < DRAWING_ASPECT_RATIO");
                newWidth = Math.max(viewportWidth, DRAWING_WIDTH_MIN);
                newHeight = Math.max(newWidth / DRAWING_ASPECT_RATIO, DRAWING_HEIGHT_MIN);
                console.log({ viewportWidth, DRAWING_WIDTH_MIN });
                console.log("Math.max(viewportWidth, DRAWING_WIDTH_MIN)", Math.max(viewportWidth, DRAWING_WIDTH_MIN),
                );
                console.log({ newWidth, DRAWING_ASPECT_RATIO, DRAWING_HEIGHT_MIN });
                console.log("Math.max(newWidth / DRAWING_ASPECT_RATIO, DRAWING_HEIGHT_MIN)", Math.max(newWidth / DRAWING_ASPECT_RATIO, DRAWING_HEIGHT_MIN),
                );
            // Viewport more landscape than drawing
            } else {
                console.log("else");
                newHeight = Math.max(viewportHeight, DRAWING_HEIGHT_MIN);
                newWidth = Math.max(newHeight * DRAWING_ASPECT_RATIO, DRAWING_WIDTH_MIN);
                console.log({ viewportHeight, DRAWING_HEIGHT_MIN, newHeight, DRAWING_ASPECT_RATIO, DRAWING_WIDTH_MIN });
                console.log({ newWidth });
            }

            const newScaleFactor = newWidth / DRAWING_WIDTH_MIN;
            console.log({ viewportHeight, viewportWidth, viewportAspectRatio, newWidth, newHeight });
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
                    drawOnCanvas(strokeArray, yOffset, context);
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
                }}
            >
                Sorry, your browser is too old for this demo.
            </canvas>
        </div>
    );
};

export const renderDrawings = (
    completedDrawings: Point[][][][] | null,
    reRenderIndex?: number,
    shouldAnimate = false,
) => {
    console.log("IN renderDrawings...");
    console.log({ completedDrawings });
    return completedDrawings?.map((completedDrawing, index) => (
        <div
            key={index}
            className={"drawing-container"}
            style={{
                marginLeft: "auto",
                marginRight: "auto",
            }}
        >
            <div style={title} className={"drawing-title"}>
                <strong>{`exquisite corpse #${index}`}</strong>
            </div>
            <CompletedDrawing completedDrawing={completedDrawing} shouldAnimate={shouldAnimate} />
        </div>
    ));
};
