import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSocketInfo } from "../../context/SocketInfoProvider";
import { DRAWING_HEIGHT_MIN, DRAWING_WIDTH_MIN, OVERLAP, PANEL_ASPECT_RATIO, PANEL_HEIGHT_MIN, PANEL_WIDTH_MIN } from "../Canvas";
import { drawOnCanvas, setCanvasDimensions, setCanvasProperties } from "../../utils/canvasUtils";
import { ScaleDirection, pixelRatio, scalePoints } from "../../utils/scaleUtils";
import { useDisableScroll } from "../../hooks/useDisableScroll";
import { debounce } from "es-toolkit";
import { aboveCanvasHeight } from "../../constants";

const CanvasSpectator: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { strokeHistory, completedDrawings } = useSocketInfo();
  
    const [ dimensions, setDimensions ] = useState({ width: DRAWING_WIDTH_MIN, height: DRAWING_HEIGHT_MIN });
    const [ scaleFactor, setScaleFactor ] = useState<number>(1);

    useDisableScroll();

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
        if (!strokeHistory) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        console.log("Redrawing canvas with dimensions:", dimensions, "and scaleFactor:", scaleFactor);

        context.clearRect(0, 0, canvas.width, canvas.height);

        // Redraw
        strokeHistory?.forEach((strokeArray) =>
            drawOnCanvas(
                scalePoints(strokeArray, ScaleDirection.TO_DISPLAY, scaleFactor),
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

        strokeHistory.forEach((strokeArray, index) => {
            drawOnCanvas(
                scalePoints(strokeArray, ScaleDirection.TO_DISPLAY, scaleFactor),
                0,
                context,
            );
            console.log(`Redrew strokeArray #${index}`);
        });
    }, [ dimensions, scaleFactor, strokeHistory ]);

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <canvas
                ref={canvasRef} 
                width={dimensions.width * pixelRatio}
                height={dimensions.height * pixelRatio}
                style={{ border: "1px solid black" }}
            >
                Sorry, your browser is too old for this demo.
            </canvas>
        </div>
    );
};

export default CanvasSpectator;
