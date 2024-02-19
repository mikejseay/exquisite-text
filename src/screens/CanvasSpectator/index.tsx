import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSocketInfo } from "../../context/SocketInfoProvider";
import { panelHeightRatioOfWindow  } from "../Canvas";
import { emitGetCanvas, emitJoinAsCanvasSpectator, emitRecognizeDevice } from "../../context/SocketRequestors";
import { Point } from "../../types";

/*
    [x] Add state that will be context state, containing all info needed
    to display the drawing for spectator view

    [x] Hard-code a request to retrieve the completed canvas

    [x] Hard-code a request to join a specific room ("BAMB") as a specific spectator

    [x] Alter the logic of this screen and its component so that all it does is
    display one complete canvas

        [x] Add functionality to (re-) draw canvas from strokeHistory (useEffect)

    [ ] Refactor get send receive retrieve listener canvas func/socket naming to not be shitty ;)
        [x] Potentially prefix all socket messages (the text) with their type e.g `stc` or `cts` (server-to-client / client-to-server)
            [x] Watch for collisions in the namespace of get/receive socket messages
        [ ] In the case that an emitter (client-to-server) is not passing data, consider adding `request`
        [ ] If your emitter is passing data (client-to-server) it should potentially have `send` in it
        [ ] All emitter wrapper functions (SocketRequestors.ts) start with `emit` and should have socket message afterwards (camel cased)
        [ ] All listeners (SocketListeners.ts) start with `receive` and have the socket message afterwards (camel cased)

    [ ] Make the drawOnCanvas func exported from Canvas into CanvasSpectator for single source of truth
*/

const CanvasSpectator: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [ hasJoinedRoom, setHasJoinedRoom ] = useState<boolean>(false);
    const { strokeHistory } = useSocketInfo();

    if (!hasJoinedRoom) {
        emitRecognizeDevice();
        emitJoinAsCanvasSpectator("ROOM", "spectator");
        emitGetCanvas();
        setHasJoinedRoom(true);
    }

    const drawOnCanvas = useCallback((newPoints: Point[]) => {
        const canvas = canvasRef.current;
        if (!canvas) {
            console.warn("No canvasRef in CanvasSpectator");
            return;
        }
        const context = canvas.getContext("2d");
        if (!context) {
            console.warn("No context in CanvasSpectator");
            return;
        }

        context.strokeStyle = "gray";
        context.lineCap = "round";
        context.lineJoin = "round";

        // newPoints is length 1 if being drawn by handleStart
        if (newPoints.length === 1) {
            const point = newPoints[0];
            context.fillStyle = "gray";
            context.lineWidth = point.lineWidth;
            context.beginPath();
            context.arc(point.x, point.y, point.lineWidth / 2, 0, Math.PI * 2);
            context.closePath();
            context.fill();
            return;
        }

        context.beginPath();

        // newPoints is length 2 if being drawn by handleMove
        for (let i = 0; i < newPoints.length - 1; i++) {
            const startPoint = newPoints[i];
            const endPoint = newPoints[i + 1];

            context.moveTo(startPoint.x, startPoint.y);
            context.lineWidth = startPoint.lineWidth;
            context.lineTo(endPoint.x, endPoint.y);
            context.stroke();
        }
    }, []);

    useEffect(() => {
        console.log("strokeHistory in CanvasSpectator:", strokeHistory);
        strokeHistory?.forEach(strokeArray => drawOnCanvas(strokeArray));
    }, [ strokeHistory ]);

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
