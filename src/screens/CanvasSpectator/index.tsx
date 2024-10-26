import React, { useEffect, useRef } from "react";
import { useSocketInfo } from "../../context/SocketInfoProvider";
import { PANEL_HEIGHT, PANEL_WIDTH, drawOnCanvas } from "../Canvas";


const CanvasSpectator: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { strokeHistory, completedDrawings } = useSocketInfo();

    // We want to draw it,
    // Then we want to clip it without ever showing the user the whole thing
    useEffect(() => {
        console.log("strokeHistory in CanvasSpectator:", strokeHistory);
        strokeHistory?.forEach(strokeArray => drawOnCanvas(strokeArray?.map(point => ({
            x: point.x * window.devicePixelRatio,
            y: point.y * window.devicePixelRatio,
            lineWidth: point.lineWidth * window.devicePixelRatio,
        })), canvasRef));
    }, [ strokeHistory, completedDrawings ]);

    // This useEffect defines the panel height
    useEffect(() => {
        const canvas = canvasRef.current;
        const devicePixelRatio = window.devicePixelRatio ?? 1;

        if (!canvas) return;
        canvas.style.width = `${PANEL_WIDTH}px`;
        canvas.style.height = `${PANEL_HEIGHT * 3}px`;
        canvas.width = PANEL_WIDTH * devicePixelRatio;
        canvas.height = PANEL_HEIGHT * devicePixelRatio * 3;
        console.log("canvas.height:", canvas.height);
    }, []);

    useEffect(() => {
        const disableScroll = (e: TouchEvent) => e.preventDefault();
        document.body.addEventListener("touchmove", disableScroll, { passive: false });

        return () => {
            document.body.removeEventListener("touchmove", disableScroll);
        };
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <canvas
                ref={canvasRef}
                onMouseDown={()=> {return;}}
                onTouchStart={()=> {return;}}
                onMouseMove={()=> {return;}}
                onTouchMove={()=> {return;}}
                onMouseUp={()=> {return;}}
                onTouchEnd={()=> {return;}}
            >
                Sorry, your browser is too old for this demo.
            </canvas>
        </div>
    );
};

export default CanvasSpectator;
