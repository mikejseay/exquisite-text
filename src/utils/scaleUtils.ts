import { Point } from "../types";

export const pixelRatio = window.devicePixelRatio || 1;

export enum ScaleDirection {
    TO_DISPLAY = "MULTIPLY",
    TO_UNIVERSAL = "DIVIDE",
}

export function scalePoints(points: Point[], scaleDirection: ScaleDirection, scaleFactor: number): Point[] {
    let factor = 1;
    if (scaleDirection === ScaleDirection.TO_DISPLAY) {
        factor = scaleFactor;
    } else if (scaleDirection === ScaleDirection.TO_UNIVERSAL) {
        factor = 1 / scaleFactor;
    } else {
        throw new Error("unrecognized ScaleDirection");
    }
    return points?.map((point) => ({
        x: point.x * factor,
        y: point.y * factor,
        lineWidth: point.lineWidth * factor,
    }));
}
