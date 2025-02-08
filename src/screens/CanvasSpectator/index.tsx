import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSocketInfo } from "../../context/SocketInfoProvider";
import { DRAWING_HEIGHT_MIN, DRAWING_WIDTH_MIN } from "../Canvas";
import { drawOnCanvas, setCanvasDimensions, setCanvasProperties } from "../../utils/canvasUtils";
import { ScaleDirection, scalePoints } from "../../utils/scaleUtils";
import { useDisableScroll } from "../../hooks/useDisableScroll";

const CanvasSpectator: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { strokeHistory, completedDrawings } = useSocketInfo();
  
    const [ dimensions, setDimensions ] = useState({ width: DRAWING_WIDTH_MIN, height: DRAWING_HEIGHT_MIN });
    const [ scaleFactor, setScaleFactor ] = useState<number>(1);

    useDisableScroll();

    // TODO: Copy full useLayoutEffect and DRY it up from src/screens/Canvas/index.tsx
    useLayoutEffect(() => {
        const handleResize = () => {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const newWidth = Math.max(DRAWING_WIDTH_MIN, viewportWidth * 0.8);
            const newHeight = Math.max(DRAWING_HEIGHT_MIN, viewportHeight * 0.8);
            setDimensions({ width: newWidth, height: newHeight });
            setScaleFactor(newWidth / DRAWING_WIDTH_MIN);
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set the canvas dimensions (and adjust for device pixel ratio)
        setCanvasDimensions(canvas, dimensions.width, dimensions.height);

        const context = canvas.getContext("2d");
        if (!context) return;
        setCanvasProperties(context);
    
        context.clearRect(0, 0, canvas.width, canvas.height);

        strokeHistory?.forEach((strokeArray) => {
            const scaledStroke = scalePoints(strokeArray, ScaleDirection.MULTIPLY, scaleFactor);
            drawOnCanvas(scaledStroke, 0, context);
        });
    }, [ strokeHistory, completedDrawings, dimensions, scaleFactor ]);

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <canvas ref={canvasRef} style={{ border: "1px solid black" }}>
                Sorry, your browser is too old for this demo.
            </canvas>
        </div>
    );
};

export default CanvasSpectator;
