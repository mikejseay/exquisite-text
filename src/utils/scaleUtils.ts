import { Point } from "../types";

export const pixelRatio = window.devicePixelRatio || 1;
export const hello = 1;

export enum ScaleDirection {
    MULTIPLY = "MULTIPLY",
    DIVIDE = "DIVIDE",
}

export function scalePoints(points: Point[], scaleDirection: ScaleDirection): Point[] {
    let factor = 1;
    if (scaleDirection === ScaleDirection.MULTIPLY) {
        factor = pixelRatio;
    } else if (scaleDirection === ScaleDirection.DIVIDE) {
        factor = 1 / pixelRatio;
    } else {
        throw new Error("unrecognized ScaleDirection");
    }
    return points?.map((point) => ({
        x: point.x * factor,
        y: point.y * factor,
        lineWidth: point.lineWidth * factor,
    }));
}
