import React, { useCallback, useEffect, useRef, useState } from "react";

interface Point {
  x: number;
  y: number;
  lineWidth: number;
}

type ExtendedTouch = Touch & {
    force?: number;
    touchType?: string;
};

const Canvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [ points, setPoints ] = useState<Point[]>([]);
    const [ strokeHistory, setStrokeHistory ] = useState<Point[][]>([]);
    const [ isMousedown, setIsMousedown ] = useState(false);
    const [ allowDirect, setAllowDirect ] = useState(true);
    const [ lineWidth, setLineWidth ] = useState(0);

    const drawOnCanvas = useCallback((newPoints: Point[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;

        context.strokeStyle = "gray";
        context.lineCap = "round";
        context.lineJoin = "round";

        if (newPoints.length === 1) {
            const point = newPoints[0];
            context.lineWidth = point.lineWidth;
            context.beginPath();
            context.arc(point.x, point.y, point.lineWidth / 2, 0, Math.PI * 2);
            context.fill();
            return;
        }

        context.beginPath();
        for (let i = 0; i < newPoints.length - 1; i++) {
            const startPoint = newPoints[i];
            const endPoint = newPoints[i + 1];

            context.moveTo(startPoint.x, startPoint.y);
            context.lineWidth = startPoint.lineWidth;
            context.lineTo(endPoint.x, endPoint.y);
            context.stroke();
        }
    }, []);

    const handleUndo = useCallback(() => {
        const newHistory = [ ...strokeHistory ];
        newHistory.pop();
        setStrokeHistory(newHistory);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;

        context.clearRect(0, 0, canvas.width, canvas.height);
        newHistory.forEach((stroke) => {
            if (newHistory.length === 0) return;

            const strokePath: Point[] = [];
            stroke.forEach((point) => {
                strokePath.push(point);
                drawOnCanvas(strokePath);
            });
        });
    }, [ drawOnCanvas, strokeHistory ]);

    const handleStart = useCallback((e: React.MouseEvent<Element, MouseEvent> | React.TouchEvent<Element>) => {
        let pressure = 0.1;
        let x = 0;
        let y = 0;

        const canvas = canvasRef.current;
        if (!canvas) return;

        if ("touches" in e) {
            const touch = e.touches[0] as ExtendedTouch;
            
            if (allowDirect || (touch && touch.touchType !== "direct")) {
                if (touch.force && touch.force > 0) {
                    pressure = touch.force;
                }
                x = (touch.pageX - canvas.offsetLeft) * 2;
                y = (touch.pageY - canvas.offsetTop) * 2;
            }
        } else {
            pressure = 1.0;
            x = (e.pageX - canvas.offsetLeft) * devicePixelRatio;
            y = (e.pageY - canvas.offsetTop) * devicePixelRatio;
        }

        setIsMousedown(true);

        const newPoint = { x, y, lineWidth: Math.log(pressure + 1) * 40 };
        setPoints((prev) => [ ...prev, newPoint ]);
        drawOnCanvas([ newPoint ]);
    }, [ allowDirect, drawOnCanvas ]);

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
    
        if ("touches" in e) {
            const touch = e.touches[0] as ExtendedTouch;
            
            if (allowDirect || (touch && touch.touchType !== "direct")) {
                if (touch.force && touch.force > 0) {
                    pressure = touch.force;
                }
                x = (touch.pageX - canvas.offsetLeft) * 2;
                y = (touch.pageY - canvas.offsetTop) * 2;
            }
        } else {
            pressure = 1.0;
            x = (e.pageX - canvas.offsetLeft) * devicePixelRatio;
            y = (e.pageY - canvas.offsetTop) * devicePixelRatio;            
        }

        setLineWidth((prev) => Math.log(pressure + 1) * 40 * 0.2 + prev * 0.8);
        const newPoint = { x, y, lineWidth };
        setPoints((prev) => {
            drawOnCanvas([ prev[prev.length - 1], newPoint ]);
            return [ ...prev, newPoint ];
        });
    }, [ allowDirect, drawOnCanvas, isMousedown ]);

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
        const devicePixelRatio = window.devicePixelRatio || 1;

        if (!canvas) return;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        canvas.width = window.innerWidth * devicePixelRatio;
        canvas.height = window.innerHeight * devicePixelRatio;
    }, []);
    
    return (
        <div>
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
            <div>
                <button onClick={handleUndo}>Undo</button>
                <button onClick={() => setAllowDirect(!allowDirect)}>Toggle Direct</button>
            </div>
        </div>
    );
};

export default Canvas;
