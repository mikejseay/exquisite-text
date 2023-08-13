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

    const drawOnCanvas = useCallback((stroke: Point[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;

        context.strokeStyle = "gray";
        context.lineCap = "round";
        context.lineJoin = "round";

        const l = stroke.length - 1;
        if (stroke.length >= 3) {
            const xc = (stroke[l].x + stroke[l - 1].x) / 2;
            const yc = (stroke[l].y + stroke[l - 1].y) / 2;
            context.lineWidth = stroke[l - 1].lineWidth;
            context.quadraticCurveTo(stroke[l - 1].x, stroke[l - 1].y, xc, yc);
            context.stroke();
            context.beginPath();
            context.moveTo(xc, yc);
        } else {
            const point = stroke[l];
            context.lineWidth = point.lineWidth;
            context.strokeStyle = "gray";
            context.beginPath();
            context.moveTo(point.x, point.y);
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
        
        if ("touches" in e) {
            const touch = e.touches[0] as ExtendedTouch;
            
            if (allowDirect || (touch && touch.touchType !== "direct")) {
                if (touch.force && touch.force > 0) {
                    pressure = touch.force;
                }
                x = touch.pageX * 2;
                y = touch.pageY * 2;
            }
        } else {
            pressure = 1.0;
            x = e.pageX * 2;
            y = e.pageY * 2;
        }
    
        if (isMousedown) {
            setIsMousedown(true);
            setLineWidth(Math.log(pressure + 1) * 40);
            setPoints((prev) => [ ...prev, { x, y, lineWidth: Math.log(pressure + 1) * 40 } ]);
            drawOnCanvas([ { x, y, lineWidth: Math.log(pressure + 1) * 40 } ]);
        }
    }, [ allowDirect, drawOnCanvas, lineWidth, isMousedown ]);

    const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!isMousedown) {
            return;
        }
        e.preventDefault();
    
        let pressure = 0.1;
        let x = 0;
        let y = 0;

        if ("touches" in e) {
            const touch = e.touches[0] as ExtendedTouch;
            
            if (allowDirect || (touch && touch.touchType !== "direct")) {
                if (touch.force && touch.force > 0) {
                    pressure = touch.force;
                }
                x = touch.pageX * 2;
                y = touch.pageY * 2;
            }
        } else {
            pressure = 1.0;
            x = e.pageX * 2;
            y = e.pageY * 2;
        }
    
        setLineWidth((prev) => Math.log(pressure + 1) * 40 * 0.2 + prev * 0.8);
        setPoints((prev) => [ ...prev, { x, y, lineWidth } ]);
        drawOnCanvas([ { x, y, lineWidth } ]);
    }, [ allowDirect, drawOnCanvas, isMousedown, lineWidth ]);
    
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
