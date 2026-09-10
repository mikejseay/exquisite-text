import type { Point } from "shared/types/types";

// Pure, network-free geometry for the drawing bot: the shape vocabulary the
// model draws with, how those shapes become strokes, and how a continuation
// finds and connects to the lines carried over from the previous panel

export type XY = { x: number; y: number };

export type Shape =
    | { type: "line"; x1: number; y1: number; x2: number; y2: number }
    | { type: "polyline"; points: XY[] } // straight segments through the points, >= 2 points
    | { type: "curve"; points: XY[] } // smooth Catmull-Rom spline through the points, >= 2 points
    | { type: "ellipse"; cx: number; cy: number; rx: number; ry: number; rotation?: number }; // closed, rotation in degrees

export type Anchor = {
    x: number;
    y: number;
    heading: "down" | "down-left" | "down-right" | "left" | "right" | "up";
    kind: "exit" | "end";
};

const DEFAULT_STEP = 4;
const ANCHOR_DEDUPE_PX = 8;
// A stroke that stops this close to the strip's bottom edge visually touches
// it (the pen is about 3 px wide), so it counts as an exit, not a loose end
const EXIT_TOLERANCE_PX = 5;
const DEFAULT_SNAP_RADIUS = 24;
const DEFAULT_WOBBLE = 0.6;

// ─── Parsing what the model sent ────────────────────────────────

function num(value: unknown): number | null {
    const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
    return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function parsePoints(raw: unknown): XY[] | null {
    if (!Array.isArray(raw)) return null;
    // a flat list [x1, y1, x2, y2, ...] is a common slip, pair it up
    if (raw.length >= 4 && raw.length % 2 === 0 && raw.every((v) => num(v) !== null)) {
        const pairs: unknown[] = [];
        for (let i = 0; i < raw.length; i += 2) pairs.push([raw[i], raw[i + 1]]);
        return parsePoints(pairs);
    }
    const points: XY[] = [];
    for (const item of raw) {
        let x: number | null = null;
        let y: number | null = null;
        if (Array.isArray(item)) {
            x = num(item[0]);
            y = num(item[1]);
        } else if (item && typeof item === "object") {
            x = num((item as { x?: unknown }).x);
            y = num((item as { y?: unknown }).y);
        }
        if (x !== null && y !== null) points.push({ x, y });
    }
    return points.length >= 2 ? points : null;
}

// Tolerant reader for one raw JSON shape from the model. Returns null for
// anything unusable rather than throwing, so one bad shape never spoils a turn
export function parseShape(raw: unknown): Shape | null {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    const type = typeof r.type === "string" ? r.type.trim().toLowerCase() : "";
    switch (type) {
        case "line": {
            const x1 = num(r.x1);
            const y1 = num(r.y1);
            const x2 = num(r.x2);
            const y2 = num(r.y2);
            if (x1 === null || y1 === null || x2 === null || y2 === null) return null;
            return { type: "line", x1, y1, x2, y2 };
        }
        case "polyline":
        case "curve": {
            const points = parsePoints(r.points);
            return points ? { type, points } : null;
        }
        case "polygon": {
            // a closed polyline
            const points = parsePoints(r.points);
            return points ? { type: "polyline", points: [...points, points[0]] } : null;
        }
        case "rect":
        case "rectangle": {
            const x = num(r.x);
            const y = num(r.y);
            const w = num(r.width ?? r.w);
            const h = num(r.height ?? r.h);
            if (x === null || y === null || w === null || h === null || w <= 0 || h <= 0) return null;
            return {
                type: "polyline",
                points: [
                    { x, y },
                    { x: x + w, y },
                    { x: x + w, y: y + h },
                    { x, y: y + h },
                    { x, y },
                ],
            };
        }
        case "ellipse":
        case "circle": {
            const cx = num(r.cx ?? r.x);
            const cy = num(r.cy ?? r.y);
            const rx = num(r.rx ?? r.r);
            const ry = num(r.ry ?? r.r);
            if (cx === null || cy === null || rx === null || ry === null || rx <= 0 || ry <= 0) return null;
            const rotation = num(r.rotation);
            return rotation === null
                ? { type: "ellipse", cx, cy, rx, ry }
                : { type: "ellipse", cx, cy, rx, ry, rotation };
        }
        default:
            return null;
    }
}

// ─── Shapes to points ───────────────────────────────────────────

function segment(a: XY, b: XY, step: number, includeStart: boolean): XY[] {
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
    const out: XY[] = [];
    for (let i = includeStart ? 0 : 1; i <= n; i++) {
        const t = i / n;
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
    return out;
}

function polylinePoints(points: XY[], step: number): XY[] {
    const out: XY[] = [points[0]];
    for (let i = 0; i < points.length - 1; i++) out.push(...segment(points[i], points[i + 1], step, false));
    return out;
}

// Uniform Catmull-Rom (tension 0.5) through every control point, endpoints
// duplicated as phantom controls so the curve starts and ends on them
function curvePoints(points: XY[], step: number): XY[] {
    if (points.length === 2) return polylinePoints(points, step);
    const p = [points[0], ...points, points[points.length - 1]];
    const out: XY[] = [points[0]];
    for (let i = 1; i < p.length - 2; i++) {
        const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
        const n = Math.max(1, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / step));
        for (let k = 1; k <= n; k++) {
            const t = k / n;
            const t2 = t * t;
            const t3 = t2 * t;
            out.push({
                x:
                    0.5 *
                    (2 * p1.x +
                        (-p0.x + p2.x) * t +
                        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
                        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
                y:
                    0.5 *
                    (2 * p1.y +
                        (-p0.y + p2.y) * t +
                        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
                        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
            });
        }
    }
    return out;
}

function ellipsePoints(shape: Extract<Shape, { type: "ellipse" }>, step: number): XY[] {
    const { cx, cy, rx, ry } = shape;
    const h = ((rx - ry) / (rx + ry)) ** 2;
    const perimeter = Math.PI * (rx + ry) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h))); // Ramanujan
    const n = Math.max(12, Math.ceil(perimeter / step));
    const rot = ((shape.rotation ?? 0) * Math.PI) / 180;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const out: XY[] = [];
    for (let i = 0; i < n; i++) {
        const a = (i / n) * 2 * Math.PI;
        const ex = rx * Math.cos(a);
        const ey = ry * Math.sin(a);
        out.push({ x: cx + ex * cos - ey * sin, y: cy + ex * sin + ey * cos });
    }
    out.push(out[0]); // close the loop exactly
    return out;
}

// Expand a shape into points along its path, roughly `step` px apart
export function expandShape(shape: Shape, step: number = DEFAULT_STEP): XY[] {
    switch (shape.type) {
        case "line":
            return segment({ x: shape.x1, y: shape.y1 }, { x: shape.x2, y: shape.y2 }, step, true);
        case "polyline":
            return polylinePoints(shape.points, step);
        case "curve":
            return curvePoints(shape.points, step);
        case "ellipse":
            return ellipsePoints(shape, step);
    }
}

// ─── Where to continue from ─────────────────────────────────────

export function pointToSegmentDistance(p: XY, a: XY, b: XY): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function headingOf(dx: number, dy: number, downwardOnly: boolean): Anchor["heading"] {
    if (!downwardOnly && Math.abs(dx) > Math.abs(dy) * 2) return dx < 0 ? "left" : "right";
    if (!downwardOnly && dy < 0 && Math.abs(dy) >= Math.abs(dx) / 2) return "up";
    const ratio = Math.abs(dy) < 1e-6 ? 0 : dx / Math.abs(dy);
    if (ratio > 0.5) return "down-right";
    if (ratio < -0.5) return "down-left";
    return "down";
}

// Exits are where a carried-over stroke crosses the band's bottom edge; loose
// ends are strokes that stop inside the band. Both are where a human would
// put their pen down to continue, so both go to the model and both attract
// the bot's stroke endpoints
export function findAnchors(hint: Point[][], bandBottom: number, max = 8): Anchor[] {
    const exits: Anchor[] = [];
    const ends: Anchor[] = [];
    for (const stroke of hint) {
        if (stroke.length < 2 || stroke[0].color === "!e") continue;
        let crossed = false;
        for (let i = 0; i < stroke.length - 1; i++) {
            const a = stroke[i];
            const b = stroke[i + 1];
            const goesOut = a.y < bandBottom && b.y >= bandBottom;
            const comesIn = a.y >= bandBottom && b.y < bandBottom;
            if (!goesOut && !comesIn) continue;
            crossed = true;
            const t = (bandBottom - a.y) / (b.y - a.y);
            // direction pointing away from the band (downward)
            const dx = goesOut ? b.x - a.x : a.x - b.x;
            const dy = goesOut ? b.y - a.y : a.y - b.y;
            exits.push({ x: a.x + (b.x - a.x) * t, y: bandBottom, heading: headingOf(dx, dy, true), kind: "exit" });
        }
        if (crossed) continue;
        // The stroke stops inside the band: its lowest point is where a
        // continuation would hang from (the chin of a head, the tip of a line)
        let lowest = 0;
        for (let i = 1; i < stroke.length; i++) if (stroke[i].y > stroke[lowest].y) lowest = i;
        const end = stroke[lowest];
        const isEndpoint = lowest === 0 || lowest === stroke.length - 1;
        const before = lowest === 0 ? stroke[1] : stroke[lowest - 1];
        const dx = end.x - before.x;
        const dy = end.y - before.y;
        if (end.y >= bandBottom - EXIT_TOLERANCE_PX) {
            exits.push({ x: end.x, y: bandBottom, heading: headingOf(dx, dy, true), kind: "exit" });
        } else {
            // an interior low point (the bottom of an arc) can only be continued downward
            const heading = isEndpoint ? headingOf(dx, dy, false) : "down";
            ends.push({ x: end.x, y: end.y, heading, kind: "end" });
        }
    }
    exits.sort((a, b) => a.x - b.x);
    ends.sort((a, b) => b.y - a.y);
    const anchors: Anchor[] = [];
    for (const candidate of [...exits, ...ends]) {
        if (anchors.some((a) => Math.hypot(a.x - candidate.x, a.y - candidate.y) < ANCHOR_DEDUPE_PX)) continue;
        anchors.push(candidate);
    }
    return anchors.slice(0, max);
}

function nearest(p: XY, anchors: Anchor[], radius: number): Anchor | undefined {
    let best: Anchor | undefined;
    let bestD = radius;
    for (const a of anchors) {
        const d = Math.hypot(a.x - p.x, a.y - p.y);
        if (d <= bestD) {
            best = a;
            bestD = d;
        }
    }
    return best;
}

// Move stroke endpoints that land near an anchor exactly onto it, so a
// continuation the model placed "about there" visibly joins the line
export function snapToAnchors(strokes: XY[][], anchors: Anchor[], radius: number = DEFAULT_SNAP_RADIUS): XY[][] {
    if (anchors.length === 0) return strokes.map((s) => s.slice());
    return strokes.map((stroke) => {
        if (stroke.length < 2) return stroke.slice();
        const out = stroke.slice();
        const head = nearest(out[0], anchors, radius);
        if (head) out[0] = { x: head.x, y: head.y };
        const tail = nearest(out[out.length - 1], anchors, radius);
        if (tail) out[out.length - 1] = { x: tail.x, y: tail.y };
        return out;
    });
}

// ─── What is really on the canvas ───────────────────────────────

// Apply the human's eraser strokes ("!e" colour, lineWidth is the diameter)
// so the model only sees marks that survived. An eraser only affects strokes
// painted before it, which is the order the canvas paints in
const ERASE_RESAMPLE_PX = 2;

// Insert points along long segments so erasing removes only what the eraser
// touched, not whole segments either side of a sparse point
function densify(stroke: Point[], spacing: number): Point[] {
    const out: Point[] = [stroke[0]];
    for (let i = 1; i < stroke.length; i++) {
        const a = stroke[i - 1];
        const b = stroke[i];
        const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / spacing);
        for (let k = 1; k < n; k++) out.push({ ...a, x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n });
        out.push(b);
    }
    return out;
}

export function applyEraser(strokes: Point[][]): Point[][] {
    if (!strokes.some((s) => s[0]?.color === "!e")) return strokes.filter((s) => s.length > 0);
    const out: Point[][] = [];
    for (const stroke of strokes) {
        if (stroke.length === 0) continue;
        if (stroke[0].color === "!e") {
            const erased: Point[][] = [];
            for (const earlier of out) {
                let piece: Point[] = [];
                for (const p of densify(earlier, ERASE_RESAMPLE_PX)) {
                    if (underEraser(p, stroke)) {
                        if (piece.length > 0) erased.push(piece);
                        piece = [];
                    } else {
                        piece.push(p);
                    }
                }
                if (piece.length > 0) erased.push(piece);
            }
            out.length = 0;
            out.push(...erased);
        } else {
            out.push(stroke);
        }
    }
    return out;
}

function underEraser(p: XY, eraser: Point[]): boolean {
    if (eraser.length === 1) {
        return Math.hypot(p.x - eraser[0].x, p.y - eraser[0].y) <= eraser[0].lineWidth / 2 + 1;
    }
    for (let i = 0; i < eraser.length - 1; i++) {
        const radius = Math.max(eraser[i].lineWidth, eraser[i + 1].lineWidth) / 2 + 1;
        if (pointToSegmentDistance(p, eraser[i], eraser[i + 1]) <= radius) return true;
    }
    return false;
}

// ─── Hand-drawn feel ────────────────────────────────────────────

function mulberry32(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// A gentle, deterministic wobble across the stroke's normal so bot lines
// read as drawn rather than plotted. Two slow sines, no per-point noise, so
// the line stays smooth at any zoom. Endpoints never move, so snapped
// connections stay connected
export function wobble(points: XY[], amplitude: number = DEFAULT_WOBBLE, seed = 1): XY[] {
    if (points.length < 3) return points.slice();
    const rand = mulberry32(seed);
    const phase1 = rand() * Math.PI * 2;
    const phase2 = rand() * Math.PI * 2;
    const period1 = 9 + rand() * 6; // points per wave
    const period2 = 23 + rand() * 10;
    const out = [points[0]];
    for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1];
        const next = points[i + 1];
        const len = Math.hypot(next.x - prev.x, next.y - prev.y) || 1;
        const nx = -(next.y - prev.y) / len;
        const ny = (next.x - prev.x) / len;
        const offset = amplitude * (0.6 * Math.sin(phase1 + i / period1) + 0.4 * Math.sin(phase2 + i / period2));
        out.push({ x: points[i].x + nx * offset, y: points[i].y + ny * offset });
    }
    out.push(points[points.length - 1]);
    return out;
}
