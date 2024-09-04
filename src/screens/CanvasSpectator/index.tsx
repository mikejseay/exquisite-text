import React, { useEffect, useRef, useState } from "react";
import { useSocketInfo } from "../../context/SocketInfoProvider";
import { PANEL_HEIGHT, PANEL_HEIGHT_RATIO_OF_WINDOW, PANEL_WIDTH, drawOnCanvas  } from "../Canvas";
import { emitJoinAs, emitRecognizeDevice, emitRequestCanvas } from "../../context/SocketRequestors";
import { Role } from "../../types";


const CanvasSpectator: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [ hasJoinedRoom, setHasJoinedRoom ] = useState<boolean>(false);
    const { strokeHistory, completedDrawings } = useSocketInfo();

    // if (!hasJoinedRoom) {
    //     emitRecognizeDevice();
    //     emitJoinAs("ROOM", "MIKEY", Role.SPECTATOR, true);
    //     emitRequestCanvas();
    //     setHasJoinedRoom(true);
    // }

    // TODO: Inside this useEffect, we want to receive the canvas vector (strokeHistory)
    // We want to draw it,
    // Then we want to clip it without ever showing the user the whole thing
    useEffect(() => {
        console.log("strokeHistory in CanvasSpectator:", strokeHistory);
        strokeHistory?.forEach(strokeArray => drawOnCanvas(strokeArray, canvasRef));
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
