import { Point } from "../types";

export enum ScaleDirection {
    MULTIPLY = "MULTIPLY",
    DIVIDE = "DIVIDE",
}

export function scalePoints(points: Point[], scaleDirection: ScaleDirection): Point[] {
    const ratio = window.devicePixelRatio || 1;
    return points?.map((point) => ({
        x: scaleDirection === ScaleDirection.MULTIPLY
            ? point.x * ratio
            : point.x / ratio,
        y: scaleDirection === ScaleDirection.MULTIPLY
            ? point.y * ratio
            : point.y / ratio,
        lineWidth: scaleDirection === ScaleDirection.MULTIPLY
            ? point.lineWidth * ratio
            : point.lineWidth / ratio,
    }));
}
