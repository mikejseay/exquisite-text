import React, { useEffect, useRef } from "react";
import { useSocketInfo } from "../../context/SocketInfoProvider";
import { DRAWING_HEIGHT_MIN, DRAWING_WIDTH_MIN } from "../Canvas";
import { drawOnCanvas, setCanvasDimensions, setCanvasProperties } from "../../utils/canvasUtils";
import { useDisableScroll } from "../../hooks/useDisableScroll";

const CanvasSpectator: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { strokeHistory, completedDrawings } = useSocketInfo();

    useDisableScroll();

    // Set initial dimensions of the canvas
    useEffect(() => {
        setCanvasDimensions(canvasRef.current, DRAWING_WIDTH_MIN, DRAWING_HEIGHT_MIN);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;
        setCanvasProperties(context);
        strokeHistory?.forEach((strokeArray) =>
            drawOnCanvas(strokeArray, 0, context),
        );
    }, [ strokeHistory, completedDrawings ]);

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <canvas ref={canvasRef} style={{ border: "1px solid black" }}>
                Sorry, your browser is too old for this demo.
            </canvas>
        </div>
    );
};

export default CanvasSpectator;
