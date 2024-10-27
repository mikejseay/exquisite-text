import { Point } from "../types";

export const lineColor = "grey";

export function drawOnCanvas (newPoints: Point[], canvasRef: React.MutableRefObject<HTMLCanvasElement | null>, yOffset = 0) {
    if (!newPoints || !newPoints.length) return;

    if (!canvasRef) {
        console.warn("No canvasRef in drawOnCanvas");
        return;
    }
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!context) {
        console.warn("No context in drawOnCanvas");
        return;
    }

    context.strokeStyle = lineColor;
    context.lineCap = "round";
    context.lineJoin = "round";

    // newPoints is length 1 if being drawn by handleStart
    if (newPoints.length === 1) {
        const point = newPoints[0];
        context.fillStyle = lineColor;
        context.lineWidth = point.lineWidth;
        context.beginPath();
        context.arc(point.x, point.y + yOffset, point.lineWidth / 2, 0, Math.PI * 2);
        context.closePath();
        context.fill();
        return;
    }

    context.beginPath();

    // newPoints is length 2 if being drawn by handleMove
    for (let i = 0; i < newPoints.length - 1; i++) {
        const startPoint = newPoints[i];
        const endPoint = newPoints[i + 1];

        context.moveTo(startPoint?.x, startPoint?.y + yOffset);
        context.lineWidth = startPoint?.lineWidth;
        context.lineTo(endPoint?.x, endPoint?.y + yOffset);
        context.stroke();
    }
}

export function setCanvasDimensions(
    canvas: HTMLCanvasElement | null,
    width: number,
    height: number,
) {
    if (!canvas) return;
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
}

