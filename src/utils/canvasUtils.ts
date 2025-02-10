import { Point } from "../types";
import { pixelRatio } from "./scaleUtils";

export const lineColor = "grey";

export function setCanvasDimensions(
    canvas: HTMLCanvasElement | null,
    width: number,
    height: number,
) {
    if (!canvas) return;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
}

export function setCanvasProperties(context: CanvasRenderingContext2D) {
    context.strokeStyle = lineColor;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.fillStyle = lineColor;
}

export function drawOnCanvas(newPoints: Point[], yOffset = 0, context: CanvasRenderingContext2D) {
    setCanvasProperties(context);
    // newPoints is length 1 if being drawn by handleStart
    if (newPoints.length === 1) {
        const point = newPoints[0];
        context.lineWidth = point.lineWidth;
        context.beginPath();
        context.arc(
            point.x * pixelRatio,
            (point.y + yOffset) * pixelRatio,
            point.lineWidth / 2 * pixelRatio,
            0,
            Math.PI * 2,
        );
        context.closePath();
        context.fill();
        return;
    }

    // newPoints is length >=2 if being drawn by handleMove
    context.beginPath();
    for (let i = 0; i < newPoints.length - 1; i++) {
        const startPoint = newPoints[i];
        const endPoint = newPoints[i + 1];

        context.moveTo(startPoint?.x * pixelRatio, (startPoint?.y + yOffset) * pixelRatio);
        context.lineWidth = startPoint?.lineWidth * pixelRatio;
        context.lineTo(endPoint?.x * pixelRatio, (endPoint?.y + yOffset) * pixelRatio);
        context.stroke();
    }
}
