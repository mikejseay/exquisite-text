import React, { useEffect, useRef } from "react";
import { useSocketInfo } from "../../context/SocketInfoProvider";
import { PANEL_HEIGHT, PANEL_WIDTH } from "../Canvas";
import { ScaleDirection, scalePoints } from "../../utils/scaleUtils";
import { drawOnCanvas, setCanvasDimensions } from "../../utils/canvasUtils";
import { useDisableScroll } from "../../hooks/useDisableScroll";

const CanvasSpectator: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { strokeHistory, completedDrawings } = useSocketInfo();

    useDisableScroll();

    useEffect(() => {
        strokeHistory?.forEach((strokeArray) =>
            drawOnCanvas(scalePoints(strokeArray, ScaleDirection.MULTIPLY), canvasRef),
        );
    }, [ strokeHistory, completedDrawings ]);

    useEffect(() => {
        setCanvasDimensions(canvasRef.current, PANEL_WIDTH, PANEL_HEIGHT * 3);
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <canvas ref={canvasRef} style={{ border: "1px solid black" }}>
                Sorry, your browser is too old for this demo.
            </canvas>
        </div>
    );
};

export default CanvasSpectator;
