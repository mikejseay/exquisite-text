import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";
import { OVERLAP, PANEL_HEIGHT, PANEL_WIDTH } from "modules/drawing_geometry";
import type { Point } from "shared/types/types";

// Server-side PNG rendering of a panel, pixel-for-pixel the same recipe the
// client's canvas uses: round caps and joins, each segment at its start
// point's width, a lone point as a filled dot, "!e" points painted white

const BAND_TINT = "#eef2ff";
const ERASER_COLOR = "#fff";

const colorOf = (color: string) => (color === "!e" ? ERASER_COLOR : color);

// Paint one stroke: a single point is a filled dot, otherwise a run of
// segments each stroked at its own start point's width
function paintStroke(ctx: SKRSContext2D, stroke: Point[]): void {
    if (stroke.length === 0) return;
    if (stroke.length === 1) {
        const p = stroke[0];
        ctx.fillStyle = colorOf(p.color);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        return;
    }
    for (let i = 0; i < stroke.length - 1; i++) {
        const a = stroke[i];
        const b = stroke[i + 1];
        ctx.strokeStyle = colorOf(a.color);
        ctx.lineWidth = a.lineWidth;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    }
}

export type RenderPanelOptions = {
    width?: number;
    height?: number;
    scale?: number;
    bandBottom?: number;
};

// Rasterize a panel (the carried-over hint, then the bot's own strokes) to a PNG
export function renderPanelPng(hint: Point[][], strokes: Point[][], opts: RenderPanelOptions = {}): Buffer {
    const width = opts.width ?? PANEL_WIDTH;
    const height = opts.height ?? PANEL_HEIGHT;
    const scale = opts.scale ?? 2;
    const bandBottom = opts.bandBottom ?? Math.round(OVERLAP * PANEL_HEIGHT);

    const canvas = createCanvas(width * scale, height * scale);
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = BAND_TINT;
    ctx.fillRect(0, 0, width, bandBottom);

    for (const stroke of hint) paintStroke(ctx, stroke);
    for (const stroke of strokes) paintStroke(ctx, stroke);

    return canvas.toBuffer("image/png");
}
