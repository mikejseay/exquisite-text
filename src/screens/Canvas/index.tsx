import React, { useCallback, useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";

interface Point {
  x: number;
  y: number;
  lineWidth: number;
}

type ExtendedTouch = Touch & {
    force?: number;
    touchType?: string;
};

interface PlayerZone {
    start: number;
    end: number;
}

const playerZoneRatios = [
    { start: 0, end: 0.33 },
    { start: 0.3, end: 0.66 },
    { start: 0.63, end: 1 },
];

const Canvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [ points, setPoints ] = useState<Point[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [ strokeHistory, setStrokeHistory ] = useState<Point[][]>([]);
    const [ isMousedown, setIsMousedown ] = useState(false);
    const [ allowDirect, setAllowDirect ] = useState(true);
    const [ lineWidth, setLineWidth ] = useState(0);
    const [ eventPressure, setEventPressure ] = useState(0.1);
    const [ drawType, setDrawType ] = useState("noDrawYet");
    const [ player, setPlayer ] = useState<number>(0);
    const [ playerZone, setPlayerZones ] = useState<[number, number]>([ 0, 0 ]);
    const [ coordinates, setCoordinates ] = useState<{ x: number, y: number}>({ x: 0, y: 0 });

    const currentPlayerZone = playerZoneRatios[player];
    const isInPlayerZone = (y: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return false;
        console.log("currentPlayerZone:");
        console.log(currentPlayerZone);
        console.log("player");
        console.log(player);
        const start = currentPlayerZone.start * canvas.height;
        const end = currentPlayerZone.end * canvas.height;
        setPlayerZones([ start, end ]);
        return y >= start && y <= end;
    };

    const switchPlayer = () => {
        if (player === 3) {
            // TODO: Show full finished poem
            // Perhaps display the result or do some finalization
            // Reset game to start again or navigate to another screen
        } else {
            setPlayer((player + 1) % 3);
            setPoints([]);
            setStrokeHistory([]);
        }
        console.log("player in switchPlayer");
    };

    const drawPlayerZones = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;

        playerZoneRatios.forEach((zone, index) => {
            const start = zone.start * canvas.height * 2;
            const end = zone.end * canvas.height;

            if (index !== player) { // Not the current player's zone
                context.fillStyle = "rgba(200,200,200,0.5)";  // Semi-transparent gray
                context.fillRect(0, start, canvas.width, end - start);
            } else {
                // Clear the section for the current player to see/draw
                context.clearRect(0, start, canvas.width, end - start);
            }
        });
    }, [ player, playerZoneRatios ]);

    useEffect(() => {
        drawPlayerZones();
    }, [ drawPlayerZones ]);

    const drawOnCanvas = useCallback((newPoints: Point[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;

        context.strokeStyle = "gray";
        context.lineCap = "round";
        context.lineJoin = "round";

        // newPoints is length 1 if being drawn by handleStart
        if (newPoints.length === 1) {
            setDrawType("fill");
            const point = newPoints[0];
            context.lineWidth = point.lineWidth;
            context.beginPath();
            context.arc(point.x, point.y, point.lineWidth / 2, 0, Math.PI * 2);
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
        let pressure = 0.1;
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
        // Check if the y-coordinate is in the player's zone
        console.log("isInPlayerZone(y):");
        console.log(isInPlayerZone(y));
        if (!isInPlayerZone(y)) return;

        setIsMousedown(true);

        const newPoint = { x, y, lineWidth: Math.log(pressure + 1) * 40 };
        setPoints((prev) => [ ...prev, newPoint ]);
        drawOnCanvas([ newPoint ]);
    }, [ allowDirect, drawOnCanvas, player ]);

    const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!isMousedown) {
            return;
        }
        e.preventDefault();

        let pressure = 0.1;
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
        if (!isInPlayerZone(y)) return;

        setLineWidth(Math.log(pressure + 1) * 40);
        const newPoint = { x, y, lineWidth: Math.log(pressure + 1) * 40 };
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

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = window.innerWidth * 2;
        canvas.height = window.innerHeight * 2;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const devicePixelRatio = window.devicePixelRatio ?? 1;

        if (!canvas) return;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        canvas.width = window.innerWidth * devicePixelRatio;
        canvas.height = window.innerHeight * devicePixelRatio;
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
                <br />
                {"Player Zone: " + playerZone}
            </p>
            <Button onClick={() => setAllowDirect(!allowDirect)}>Toggle Direct</Button>
            <Button onClick={switchPlayer}>
                {player < 3
                    ? "Pass"
                    : "Finish"}
            </Button>
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
