import React, { useCallback, useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import { Point } from "../../types";
import { createGameHost, requestJoinAsCanvasEditor, requestRecognizeDevice, requestSendCanvas } from "../../context/SocketRequestors";

type ExtendedTouch = Touch & {
    force?: number;
    touchType?: string;
};

const defaultLineWidth = 30;
const fullCanvasHeightRatioOfWindow = 0.8;
export const panelHeightRatioOfWindow = 0.3;
const overlap = 0.2;
const defaultPressure = 0.1;
const lineColor = "grey";

/*
    [x] Send client-server message (at least stroke history and author) via a
    JSON-serializable object of some kind (CanvasHistory)

    [x] Hard-code a request to join a specific room ("ROOM") as a specific editor

    [x] Add a button or piece of functionality that passes the completed canvas
    to the back-end, it triggers a client-to-server message

    [x] Defining the type for the client to server and server to client messages
    in the types file

    [x] Adding the corresponding methods to the editor and spectator classes
    in the server socket code
*/

const Canvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [ points, setPoints ] = useState<Point[]>([]);
    const [ strokeHistory, setStrokeHistory ] = useState<Point[][]>([]);
    const [ playerCanvases, setPlayerCanvases ] = useState<ImageData[]>([]);
    const [ isMousedown, setIsMousedown ] = useState(false);
    const [ allowDirect, setAllowDirect ] = useState(true);
    const [ lineWidth, setLineWidth ] = useState(0);
    const [ eventPressure, setEventPressure ] = useState(defaultPressure);
    const [ drawType, setDrawType ] = useState<"fill" | "stroke" | "noDrawYet">("noDrawYet");
    const [ player, setPlayer ] = useState<number>(0);
    const [ coordinates, setCoordinates ] = useState<{ x: number, y: number}>({ x: 0, y: 0 });
    const [ hasJoinedRoom, setHasJoinedRoom ] = useState<boolean>(false);

    if (!hasJoinedRoom) {
        createGameHost("ROOM");
        requestRecognizeDevice();
        requestJoinAsCanvasEditor("ROOM", "editor");
        setHasJoinedRoom(true);
    }

    const switchPlayer = () => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (canvas && context) {
            // Extract the whole canvas
            const playerCanvas = context.getImageData(0, 0, canvas.width, canvas.height);

            // Add it to a list of canvases per player
            const newPlayerCanvases = [ ...playerCanvases, playerCanvas ];
            setPlayerCanvases(newPlayerCanvases);

            // Shift canvas contents upward by 0.8 times the canvas height (old method)
            const imageData = context.getImageData(0, context.canvas.height * (1 - overlap), context.canvas.width, context.canvas.height);
            context.putImageData(imageData, 0, 0);
            context.clearRect(context.canvas.width, context.canvas.height * overlap, 0, context.canvas.height);

            // Shift canvas contents upward by 0.8 times the canvas height (new method)
            // context.globalCompositeOperation = "copy";
            // context.drawImage(context.canvas, 0, -context.canvas.height * (1 - overlap));
            // context.globalCompositeOperation = "source-over";

            // Completion: If the third panel is being submitted, clear the canvas, then construct a new one
            // using the "full available height", then paste the image data from each individual player's canvas
            // into the three vertical panels, shifting downwards by 0.8 times the canvas height each time.
            if (player === 2) {
                context.clearRect(0, 0, canvas.width, canvas.height);
                let yOffset = 0;


                canvas.style.height = `${window.innerHeight * fullCanvasHeightRatioOfWindow}px`;
                canvas.height = window.innerHeight * devicePixelRatio * fullCanvasHeightRatioOfWindow;

                newPlayerCanvases.forEach((pc) => {
                    context.putImageData(pc, 0, yOffset);
                    yOffset += Math.floor(pc.height * (1 - overlap));
                });
            } else {
                setPlayer(player + 1);
                setPoints([]);
                setStrokeHistory([]);
            }
        }
    };

    const submitCanvas = () => {
        console.log("submitCanvas:", strokeHistory);
        requestSendCanvas(strokeHistory);
    };

    const drawOnCanvas = useCallback((newPoints: Point[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;

        context.strokeStyle = lineColor;
        context.lineCap = "round";
        context.lineJoin = "round";

        // newPoints is length 1 if being drawn by handleStart
        if (newPoints.length === 1) {
            setDrawType("fill");
            const point = newPoints[0];
            context.fillStyle = lineColor;
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
            setDrawType("stroke");
            const startPoint = newPoints[i];
            const endPoint = newPoints[i + 1];

            context.moveTo(startPoint.x, startPoint.y);
            context.lineWidth = startPoint.lineWidth;
            context.lineTo(endPoint.x, endPoint.y);
            context.stroke();
        }
    }, []);

    const handleStart = useCallback((e: React.MouseEvent<Element, MouseEvent> | React.TouchEvent<Element>) => {
        let pressure = defaultPressure;
        let x = 0;
        let y = 0;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const canvasBounds = canvas.getBoundingClientRect();

        if ("touches" in e) {
            const touch = e.touches[0] as ExtendedTouch;
            x = ((touch.pageX - canvasBounds.left - window.scrollX) * window.devicePixelRatio);
            y = ((touch.pageY - canvasBounds.top - window.scrollY) * window.devicePixelRatio);

            if (allowDirect || (touch && touch.touchType !== "direct")) {
                if (touch.force && touch.force > 0) {
                    pressure = touch.force;
                    setEventPressure(pressure);
                }
            }
        } else {
            pressure = 1.0;
            x = (e.pageX - canvasBounds.left - window.scrollX) * window.devicePixelRatio;
            y = (e.pageY - canvasBounds.top - window.scrollY) * window.devicePixelRatio;
        }

        setCoordinates({ x, y });
        setIsMousedown(true);

        setLineWidth(Math.log(pressure + 1) * defaultLineWidth);
        const newPoint = { x, y, lineWidth: Math.log(pressure + 1) * defaultLineWidth };
        setPoints((prev) => [ ...prev, newPoint ]);
        drawOnCanvas([ newPoint ]);
    }, [ allowDirect, drawOnCanvas, player ]);

    const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!isMousedown) {
            return;
        }
        e.preventDefault();

        let pressure = defaultPressure;
        let x = 0;
        let y = 0;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const canvasBounds = canvas.getBoundingClientRect();

        if ("touches" in e) {
            const touch = e.touches[0] as ExtendedTouch;

            if (allowDirect || (touch && touch.touchType !== "direct")) {
                if (touch.force && touch.force > 0) {
                    pressure = touch.force;
                    setEventPressure(pressure);
                }
                x = ((touch.pageX - canvasBounds.left - window.scrollX) * window.devicePixelRatio);
                y = ((touch.pageY - canvasBounds.top - window.scrollY) * window.devicePixelRatio);
            }
            y = ((touch.pageY - canvasBounds.top) * window.devicePixelRatio);

        } else {
            pressure = 1.0;
            x = (e.pageX - canvasBounds.left - window.scrollX) * window.devicePixelRatio;
            y = (e.pageY - canvasBounds.top - window.scrollY) * window.devicePixelRatio;
        }
        setCoordinates({ x, y });

        setLineWidth(Math.log(pressure + 1) * defaultLineWidth);
        const newPoint = { x, y, lineWidth: Math.log(pressure + 1) * defaultLineWidth };
        setPoints((prev) => {
            drawOnCanvas([ prev[prev.length - 1], newPoint ]);
            return [ ...prev, newPoint ];
        });
    }, [ allowDirect, drawOnCanvas, isMousedown, player ]);

    const handleEnd = useCallback(() => {
        setIsMousedown(false);
        setStrokeHistory((prev) => [ ...prev, points ]);
        setPoints([]);
        setLineWidth(0);
    }, [ points ]);


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
            <p style={{ textAlign: "center" }}>
                {"Pressure: " + eventPressure}
                <br />
                {"Line Width: " + lineWidth}
                <br />
                {"Draw Type: " + drawType}
                <br />
                {"Current Player: " + player}
                <br />
                {"Coordinates: " + JSON.stringify(coordinates)}
            </p>
            <Button onClick={() => setAllowDirect(!allowDirect)}>Toggle Direct</Button>
            <Button onClick={switchPlayer}>
                {player < 2
                    ? "Pass"
                    : "Finish"}
            </Button>
            <Button onClick={submitCanvas}>Submit Canvas</Button>
            <canvas
                ref={canvasRef}
                onMouseDown={handleStart}
                onTouchStart={handleStart}
                onMouseMove={handleMove}
                onTouchMove={handleMove}
                onMouseUp={handleEnd}
                onTouchEnd={handleEnd}
            >
                Sorry, your browser is too old for this demo.
            </canvas>
        </div>
    );
};

export default Canvas;
