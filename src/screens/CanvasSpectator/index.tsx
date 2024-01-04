import React, { useEffect, useRef } from "react";
import { useSocketInfo } from "../../context/SocketInfoProvider";
import { panelHeightRatioOfWindow  } from "./../Canvas";

/*
    - Add state that will be context state, containing all info needed
    to display the drawing for spectator view

    - Hard-code a request to retrieve the completed canvas

    - Hard-code a request to join a specific room ("BAMB") as a specific spectator

    - Alter the logic of this screen and its component so that all it does is
    display one complete canvas

    - Add functionality to draw canvas from strokeHistory (useEffect)
    */
const CanvasSpectator: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { strokeHistory } = useSocketInfo();

    // This useEffect defines the panel height
    useEffect(() => {
        const canvas = canvasRef.current;
        const devicePixelRatio = window.devicePixelRatio ?? 1;

        if (!canvas) return;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight * panelHeightRatioOfWindow}px`;
        canvas.width = window.innerWidth * devicePixelRatio;
        canvas.height = window.innerHeight * devicePixelRatio * panelHeightRatioOfWindow;
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
