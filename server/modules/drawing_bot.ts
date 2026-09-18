import { AIMessage, type BaseMessage, HumanMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import {
    drawHintEmpty,
    drawHintEmptyLater,
    drawHintPresent,
    drawIdeas,
    drawSystemPrompt,
    drawUserPrompt,
} from "llm_utils/prompts";
import {
    type Anchor,
    applyEraser,
    DEFAULT_SNAP_RADIUS,
    expandShape,
    findAnchors,
    parseShape,
    pointToSegmentDistance,
    type Shape,
    snapToAnchors,
    wobble,
    type XY,
} from "modules/drawing_geometry";
import type { Point } from "shared/types/types";
import { logger } from "utilities/loggerUtils";

// The drawing bot's turn, in vector form. The model is shown only what a
// human player is shown (the bottom OVERLAP band of the previous panel, moved
// to the top of a blank panel), decides on a subject for its position in the
// picture (top / middle / bottom) and answers with a small program of shapes.
// We expand those shapes into dense strokes, snap them onto the carried-over
// lines' exit points so the continuation visibly connects, and enforce the
// relay rules deterministically:
//   1. Input: extractHintEnd() shows the model only the carried band
//   2. Output: stripHintEcho() drops strokes that merely retrace that band
//   3. Carry: unless this is the bottom panel, some stroke must reach the
//      bottom of the panel so the next player has something to continue
//
// The model is stateless per panel. If an answer fails a check we ask again
// with the failed answer and a one-line correction in the conversation.

// Panel geometry, the single source of truth (mirrors the client Canvas
// constants PANEL_WIDTH_MIN / PANEL_HEIGHT_MIN / OVERLAP)
export const PANEL_WIDTH = 667;
export const PANEL_HEIGHT = 300;
export const OVERLAP = 0.2;

// Distance (px) within which a model point counts as "the same" as a hint
// point when deciding whether a stroke merely retraces the carried band
const ECHO_EPSILON = 3;
// A contribution "reaches the bottom" when a stroke gets within this fraction
// of the panel height from the bottom edge
const BOTTOM_REACH = 0.1;
// How far below the strip a fringe line end (any exit that is not one of the
// two sides) may run before the answer is sent back
const FRINGE_REACH_PX = 80;
const DEFAULT_MAX_SHAPES = 16;

export type PanelCompletion = {
    strokes: Point[][];
    description: string;
};

export type CompletePanelOptions = {
    canvasWidth?: number;
    canvasHeight?: number;
    overlap?: number; // fraction of the top occupied by the previous player's "end"
    panelIndex?: number; // 0-based position of this panel within the drawing
    nPanels?: number; // total panels in the drawing
    maxShapes?: number;
    color?: string;
    lineWidth?: number;
    maxTries?: number;
};

// ─── Pure geometry (network-free, unit-tested) ──────────────────

// Reproduce, in vector form, what a human editor is shown: only the bottom
// OVERLAP strip of the previous panel, translated up so it sits at the top of
// a fresh panel. Eraser strokes are applied first so erased marks never reach
// the model. Strokes are clipped at the strip's edges (with the crossing
// point interpolated, so a line entering the strip starts exactly on its top
// edge), the same way the client raster-clips everything above the band
export function extractHintEnd(
    prevPanel: Point[][],
    panelHeight: number = PANEL_HEIGHT,
    overlap: number = OVERLAP,
): Point[][] {
    const cutoff = (1 - overlap) * panelHeight; // y >= cutoff is the visible "end"
    const inside = (p: Point) => p.y >= cutoff && p.y <= panelHeight;
    const crossing = (a: Point, b: Point, y: number): Point => {
        const t = (y - a.y) / (b.y - a.y);
        return { ...a, x: a.x + (b.x - a.x) * t, y };
    };
    const result: Point[][] = [];
    for (const stroke of applyEraser(prevPanel)) {
        let segment: Point[] = [];
        for (let i = 0; i < stroke.length; i++) {
            const p = stroke[i];
            const prev = stroke[i - 1];
            if (inside(p)) {
                // entering the strip from above or below: start on the edge
                if (prev && !inside(prev)) segment.push(crossing(prev, p, prev.y < cutoff ? cutoff : panelHeight));
                segment.push(p);
            } else if (prev && inside(prev)) {
                // leaving the strip: end on the edge, then lift the pen
                segment.push(crossing(prev, p, p.y < cutoff ? cutoff : panelHeight));
                result.push(segment);
                segment = [];
            }
        }
        if (segment.length > 0) result.push(segment);
    }
    return result.map((seg) => seg.map((p) => ({ ...p, y: p.y - cutoff })));
}

// Is point P within epsilon of the hint polyline (any segment of any stroke)?
function pointLiesOnHint(p: XY, hint: XY[][], epsilon: number): boolean {
    for (const h of hint) {
        if (h.length === 1) {
            if (Math.hypot(p.x - h[0].x, p.y - h[0].y) <= epsilon) return true;
            continue;
        }
        for (let i = 0; i < h.length - 1; i++) {
            if (pointToSegmentDistance(p, h[i], h[i + 1]) <= epsilon) return true;
        }
    }
    return false;
}

// Drop strokes that merely parrot the carried-over edge back. A stroke is
// regurgitation when every one of its points both lies on the hint polyline
// and stays inside the carried band. A genuine continuation leaves the band
// or departs from the hint path, so it survives
export function stripHintEcho<T extends XY>(
    strokes: T[][],
    hint: XY[][],
    bandBottom: number,
    epsilon: number = ECHO_EPSILON,
): T[][] {
    if (hint.length === 0) return strokes;
    return strokes.filter((s) => {
        const isRegurgitation = s.every((p) => p.y <= bandBottom + epsilon && pointLiesOnHint(p, hint, epsilon));
        return !isRegurgitation;
    });
}

// Remove points outside the panel, splitting a stroke where it leaves, so a
// shape that runs off the edge just ends there (like a pen leaving the paper)
function clipToCanvas(points: XY[], width: number, height: number): XY[][] {
    const pieces: XY[][] = [];
    let piece: XY[] = [];
    for (const p of points) {
        if (p.x >= 0 && p.x <= width && p.y >= 0 && p.y <= height) {
            piece.push(p);
        } else if (piece.length > 0) {
            pieces.push(piece);
            piece = [];
        }
    }
    if (piece.length > 0) pieces.push(piece);
    return pieces;
}

export type ShapesToStrokesOptions = {
    canvasWidth: number;
    canvasHeight: number;
    bandBottom: number;
    anchors: Anchor[];
    maxShapes: number;
    color: string;
    lineWidth: number;
    epsilon?: number;
    step?: number;
};

// Turn the model's shape program into styled, connected, in-bounds, echo-free
// strokes. Pure and deterministic so it can be unit-tested without the network
export function shapesToStrokes(shapes: Shape[], hint: XY[][], opts: ShapesToStrokesOptions): Point[][] {
    const expanded = shapes.slice(0, opts.maxShapes).map((shape) => expandShape(shape, opts.step));
    const snapped = snapToAnchors(expanded, opts.anchors);
    const clipped = snapped.flatMap((stroke, i) =>
        clipToCanvas(wobble(stroke, undefined, i + 1), opts.canvasWidth, opts.canvasHeight),
    );
    const styled: Point[][] = clipped.map((stroke) =>
        stroke.map((p) => ({ x: p.x, y: p.y, lineWidth: opts.lineWidth, color: opts.color })),
    );
    return stripHintEcho(styled, hint, opts.bandBottom, opts.epsilon);
}

function reachesBottom(strokes: Point[][], canvasHeight: number): boolean {
    const zone = canvasHeight * (1 - BOTTOM_REACH);
    return strokes.some((s) => s.some((p) => p.y >= zone));
}

// The outermost pair of exits are the sides of whatever comes next. Every
// exit between them is fringe (hair, tentacles, teeth) that a partner ties
// off short. Seen live: told to continue all eight exits, the model ran a
// wire from each to the bottom edge and called it a robot, every game
export function splitExits(anchors: Anchor[]): { sides: Anchor[]; fringe: Anchor[] } {
    const exits = anchors.filter((a) => a.kind === "exit").sort((a, b) => a.x - b.x);
    if (exits.length <= 2) return { sides: exits, fringe: [] };
    return { sides: [exits[0], exits[exits.length - 1]], fringe: exits.slice(1, -1) };
}

// Fringe anchors the model ran a long line down from anyway
export function fringeOverrun(strokes: XY[][], anchors: Anchor[], bandBottom: number): Anchor[] {
    const { sides, fringe } = splitExits(anchors);
    const near = (p: XY, a: Anchor) => Math.hypot(p.x - a.x, p.y - a.y) <= DEFAULT_SNAP_RADIUS;
    return fringe.filter((a) =>
        strokes.some((s) => {
            const ends = [s[0], s[s.length - 1]];
            const onFringe = ends.some((p) => near(p, a)) && !ends.some((p) => sides.some((b) => near(p, b)));
            return onFringe && s.some((p) => p.y > bandBottom + FRINGE_REACH_PX);
        }),
    );
}

// The human pen at default settings: log(1 + 0.5 pressure) * 8 px base width
const DEFAULT_PEN_COLOR = "#7F7F7F";
const DEFAULT_PEN_WIDTH = Math.log(1.5) * 8;

// The colour most of the carried-over ink was drawn in (eraser strokes never
// reach here), falling back to the default pen on a blank panel
export function dominantColor(hint: Point[][]): string {
    const tally = new Map<string, number>();
    for (const p of hint.flat()) tally.set(p.color, (tally.get(p.color) ?? 0) + 1);
    let best = DEFAULT_PEN_COLOR;
    let bestCount = 0;
    for (const [color, count] of tally) {
        if (count > bestCount) {
            best = color;
            bestCount = count;
        }
    }
    return best;
}

export function medianLineWidth(hint: Point[][]): number {
    const widths = hint
        .flat()
        .map((p) => p.lineWidth)
        .filter((w) => Number.isFinite(w) && w > 0)
        .sort((a, b) => a - b);
    if (widths.length === 0) return DEFAULT_PEN_WIDTH;
    return Math.max(1.5, Math.min(12, widths[Math.floor(widths.length / 2)]));
}

// ─── Prompt assembly ────────────────────────────────────────────

function describeBoundingBox(hint: XY[][]): string {
    const points = hint.flat();
    if (points.length === 0) return "nothing";
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    return `x ${Math.round(Math.min(...xs))} to ${Math.round(Math.max(...xs))}, y ${Math.round(Math.min(...ys))} to ${Math.round(Math.max(...ys))}`;
}

const describeAnchor = (a: Anchor) => `(${Math.round(a.x)}, ${Math.round(a.y)}) heading ${a.heading}`;

function describeLooseEnds(anchors: Anchor[]): string {
    const list = anchors.filter((a) => a.kind === "end");
    return list.length === 0 ? "none" : list.map(describeAnchor).join("; ");
}

function describeExits(anchors: Anchor[], bandBottom: number): string {
    const { sides, fringe } = splitExits(anchors);
    if (sides.length === 0) return "none";
    let text = sides.map(describeAnchor).join("; ");
    if (sides.length === 2) text += ` (${Math.round(sides[1].x - sides[0].x)} px apart)`;
    if (fringe.length === 0) return text;
    return `the two SIDES to grow your outline from: ${text}. Between them, FRINGE: ${fringe.length} more line end(s) to tie off within ${FRINGE_REACH_PX} px (a flick, a curl, a drip, ending by y=${bandBottom + FRINGE_REACH_PX}) or leave alone: ${fringe.map(describeAnchor).join("; ")}`;
}

function pickIdeas(pool: string[], n: number): string[] {
    const bag = pool.slice();
    const picked: string[] = [];
    while (picked.length < n && bag.length > 0) picked.push(bag.splice(Math.floor(Math.random() * bag.length), 1)[0]);
    return picked;
}

export function positionOf(panelIndex: number, nPanels: number): "top" | "middle" | "bottom" {
    if (panelIndex <= 0) return "top";
    if (panelIndex >= nPanels - 1) return "bottom";
    return "middle";
}

const positionAdvice = {
    top: "Draw the TOP of a thing. Finish with lines running off the bottom edge (a neck, a trunk, walls) for the next player to continue.",
    middle: "Draw the MIDDLE of a thing. Attach it to the exits at the top, and send two lines off the bottom edge (hips, legs, a stem, an axle) for the next player to continue.",
    bottom: "Draw the BOTTOM of a thing and finish the picture, with a bit of ground or shadow. Attach it to the exits at the top. The picture ends at your bottom edge, so nothing needs to run off it.",
};

// The model only ever reasons about position. Color and width are ours to
// assign, so the hint is reduced to rounded [x, y] pairs clamped into the
// band and thinned (a mouse stroke has a point per pixel or so, which is
// noise to the model). This is exactly the geometry stripHintEcho later
// compares against
const PROMPT_THIN_PX = 3;
function hintForPrompt(hint: Point[][], width: number, bandBottom: number): XY[][] {
    return hint.map((stroke) => {
        const rounded = stroke.map((p) => ({
            x: Math.round(Math.max(0, Math.min(width, p.x))),
            y: Math.round(Math.max(0, Math.min(bandBottom, p.y))),
        }));
        const thin: XY[] = [rounded[0]];
        for (const p of rounded.slice(1)) {
            const last = thin[thin.length - 1];
            if (Math.hypot(p.x - last.x, p.y - last.y) >= PROMPT_THIN_PX) thin.push(p);
        }
        const end = rounded[rounded.length - 1];
        const last = thin[thin.length - 1];
        if (rounded.length > 1 && (end.x !== last.x || end.y !== last.y)) thin.push(end);
        return thin;
    });
}

// ─── Model plumbing ─────────────────────────────────────────────

const drawPrompt = ChatPromptTemplate.fromMessages([
    ["system", drawSystemPrompt],
    ["human", drawUserPrompt],
    ["placeholder", "{feedback}"],
]);

let chain: ReturnType<typeof buildChain> | undefined;
function buildChain() {
    const model = process.env.DRAWING_BOT_MODEL ?? "gpt-4.1";
    // ponytail: reasoning models only accept the default temperature
    const temperature = /^(gpt-5|o\d)/.test(model) ? undefined : 0.8;
    const llm = new ChatOpenAI({
        model,
        temperature,
        timeout: 30_000,
        maxRetries: 1,
        modelKwargs: { response_format: { type: "json_object" } },
    });
    return drawPrompt.pipe(llm).pipe(new StringOutputParser());
}

async function generate(vars: Record<string, string>, feedback: BaseMessage[]): Promise<string> {
    if (!chain) chain = buildChain();
    return chain.invoke({ ...vars, feedback });
}

// Tolerate code fences or stray prose around the JSON object
function extractJSON(raw: string): unknown {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) {
        throw new Error("no JSON object found in model response");
    }
    return JSON.parse(raw.slice(start, end + 1));
}

type RawCompletion = { subject?: unknown; description?: unknown; shapes?: unknown; strokes?: unknown };

// Accept the shape program, and be lenient with a model that answers in the
// older raw-strokes form (each stroke a list of [x, y] pairs)
export function parseCompletion(raw: string): { shapes: Shape[]; description: string; invalid: number } {
    const parsed = extractJSON(raw) as RawCompletion;
    const rawShapes: unknown[] = Array.isArray(parsed.shapes)
        ? parsed.shapes
        : parsed.shapes && typeof parsed.shapes === "object"
          ? Object.values(parsed.shapes) // shapes keyed by name instead of listed
          : Array.isArray(parsed.strokes)
            ? parsed.strokes.map((points) => ({ type: "polyline", points }))
            : [];
    const shapes: Shape[] = [];
    let invalid = 0;
    for (const s of rawShapes) {
        const shape = parseShape(s);
        if (shape) shapes.push(shape);
        else invalid++;
    }
    const subject = parsed.subject ?? parsed.description;
    return { shapes, description: typeof subject === "string" ? subject : "", invalid };
}

// ─── Fake model for end-to-end tests (no network) ───────────────

// A deterministic stand-in used when DRAWING_BOT_FAKE=1: draws a head, a
// torso or legs anchored on the real exits, so the whole socket / turn /
// rendering pipeline can be exercised without an API key
export function fakeCompletion(
    position: "top" | "middle" | "bottom",
    anchors: Anchor[],
    width: number,
    height: number,
) {
    const exits = anchors.filter((a) => a.kind === "exit").map((a) => a.x);
    const hang = exits.length > 0 ? exits : anchors.map((a) => a.x); // exits, else loose ends
    const mid = hang.length > 0 ? (Math.min(...hang) + Math.max(...hang)) / 2 : width / 2;
    const l = exits.length > 1 ? Math.min(...exits) : mid - 20;
    const r = exits.length > 1 ? Math.max(...exits) : mid + 20;
    const top = anchors.length > 0 ? 60 : 0;
    const shapes: Record<typeof position, unknown[]> = {
        top: [
            { type: "circle", cx: mid, cy: 110, r: 70 },
            { type: "circle", cx: mid - 28, cy: 95, r: 7 },
            { type: "circle", cx: mid + 28, cy: 95, r: 7 },
            {
                type: "curve",
                points: [
                    [mid - 35, 135],
                    [mid, 152],
                    [mid + 35, 135],
                ],
            },
            {
                type: "polyline",
                points: [
                    [mid - 60, 60],
                    [mid - 40, 20],
                    [mid - 20, 50],
                    [mid, 10],
                    [mid + 20, 50],
                    [mid + 40, 20],
                    [mid + 60, 60],
                ],
            },
            { type: "line", x1: mid - 20, y1: 178, x2: mid - 20, y2: height },
            { type: "line", x1: mid + 20, y1: 178, x2: mid + 20, y2: height },
        ],
        middle: [
            {
                type: "curve",
                points: [
                    [l, top],
                    [mid - 110, top + 30],
                    [mid - 95, height],
                ],
            },
            {
                type: "curve",
                points: [
                    [r, top],
                    [mid + 110, top + 30],
                    [mid + 95, height],
                ],
            },
            {
                type: "curve",
                points: [
                    [mid - 108, top + 45],
                    [mid - 160, top + 120],
                    [mid - 150, top + 200],
                ],
            },
            {
                type: "curve",
                points: [
                    [mid + 108, top + 45],
                    [mid + 160, top + 120],
                    [mid + 150, top + 200],
                ],
            },
            { type: "circle", cx: mid, cy: top + 70, r: 5 },
            { type: "circle", cx: mid, cy: top + 110, r: 5 },
            { type: "circle", cx: mid, cy: top + 150, r: 5 },
            { type: "line", x1: mid - 97, y1: top + 185, x2: mid + 97, y2: top + 185 },
        ],
        bottom: [
            {
                type: "polyline",
                points: [
                    [l, top],
                    [l - 5, top + 150],
                    [l - 10, height - 25],
                ],
            },
            {
                type: "polyline",
                points: [
                    [r, top],
                    [r + 5, top + 150],
                    [r + 10, height - 25],
                ],
            },
            {
                type: "curve",
                points: [
                    [l - 10, height - 25],
                    [l - 50, height - 15],
                    [l - 45, height - 5],
                    [l + 25, height - 5],
                    [l + 20, height - 25],
                ],
            },
            {
                type: "curve",
                points: [
                    [r + 10, height - 25],
                    [r + 50, height - 15],
                    [r + 45, height - 5],
                    [r - 25, height - 5],
                    [r - 20, height - 25],
                ],
            },
            { type: "line", x1: 40, y1: height - 5, x2: width - 40, y2: height - 5 },
        ],
    };
    const subjects = { top: "a spiky-haired head", middle: "a buttoned-up torso", bottom: "legs on the ground" };
    return JSON.stringify({ subject: `fake: ${subjects[position]}`, shapes: shapes[position] });
}

// ─── The turn ───────────────────────────────────────────────────

export async function completePanel(hint: Point[][], opts: CompletePanelOptions = {}): Promise<PanelCompletion> {
    const canvasWidth = opts.canvasWidth ?? PANEL_WIDTH;
    const canvasHeight = opts.canvasHeight ?? PANEL_HEIGHT;
    const overlap = opts.overlap ?? OVERLAP;
    const nPanels = opts.nPanels ?? 3;
    const panelIndex = opts.panelIndex ?? (hint.length > 0 ? 1 : 0);
    const maxShapes = opts.maxShapes ?? DEFAULT_MAX_SHAPES;
    // Match the previous player's pen so the continuation reads as one drawing
    const color = opts.color ?? dominantColor(hint);
    const lineWidth = opts.lineWidth ?? medianLineWidth(hint);
    const maxTries = opts.maxTries ?? 3;

    const bandBottom = Math.round(overlap * canvasHeight);
    const position = positionOf(panelIndex, nPanels);
    const anchors = findAnchors(hint, bandBottom);
    const promptHint = hintForPrompt(hint, canvasWidth, bandBottom);
    const hintSection =
        hint.length === 0
            ? position === "top"
                ? drawHintEmpty
                : drawHintEmptyLater
            : drawHintPresent
                  .replaceAll("{band_bottom}", bandBottom.toString())
                  .replace("{n_strokes}", hint.length.toString())
                  .replace("{bbox}", describeBoundingBox(promptHint))
                  .replace("{exits}", describeExits(anchors, bandBottom))
                  .replace("{loose_ends}", describeLooseEnds(anchors))
                  .replace("{input}", JSON.stringify(promptHint.map((s) => s.map((p) => [p.x, p.y]))));
    const promptVars = {
        canvas: `${canvasWidth} wide by ${canvasHeight} tall`,
        n_panels: nPanels.toString(),
        panel_number: (panelIndex + 1).toString(),
        position,
        position_advice: positionAdvice[position],
        ideas: pickIdeas(drawIdeas[position], 3).join(", "),
        panel_bottom: canvasHeight.toString(),
        hint_section: hintSection,
    };
    const strokeOpts: ShapesToStrokesOptions = {
        canvasWidth,
        canvasHeight,
        bandBottom,
        anchors,
        maxShapes,
        color,
        lineWidth,
    };
    const mustReachBottom = position !== "bottom";
    logger.debug(`drawing bot panel ${panelIndex + 1}/${nPanels} (${position}):\n${hintSection}`);

    // Prefer an answer that hands the picture on; keep the best fallback (the
    // fewest complaints, then reaching furthest down) so a stubborn model never
    // dead-ends the turn
    let best: PanelCompletion | undefined;
    let bestScore = Number.NEGATIVE_INFINITY;
    let feedback: BaseMessage[] = [];
    let lastErr: Error | undefined;
    let attempts = 0;
    for (let attempt = 1; attempt <= maxTries; attempt++) {
        attempts = attempt;
        let raw = "";
        try {
            raw =
                process.env.DRAWING_BOT_FAKE === "1"
                    ? fakeCompletion(position, anchors, canvasWidth, canvasHeight)
                    : await generate(promptVars, feedback);
            logger.debug(`drawing bot raw completion (attempt ${attempt}):\n${raw}`);
            const { shapes, description, invalid } = parseCompletion(raw);
            if (invalid > 0) logger.debug(`drawing bot: ignored ${invalid} malformed shape(s)`);
            if (shapes.length === 0) throw new Error("response had no valid shapes");
            const strokes = shapesToStrokes(shapes, promptHint, strokeOpts);
            if (strokes.length === 0) throw new Error("model only retraced the carried-over strokes");

            const lowestY = Math.max(...strokes.flat().map((p) => p.y));
            const complaints: string[] = [];
            const overrun = fringeOverrun(strokes, anchors, bandBottom);
            if (overrun.length > 0) {
                complaints.push(
                    `you ran long lines down from the fringe ends at ${overrun.map((a) => `(${Math.round(a.x)}, ${Math.round(a.y)})`).join(", ")}, and only the two SIDES may run down the panel: end each fringe line by y=${bandBottom + FRINGE_REACH_PX} or leave it out`,
                );
            }
            if (mustReachBottom && !reachesBottom(strokes, canvasHeight)) {
                complaints.push(
                    `your lowest point was y=${Math.round(lowestY)}, so the next player would get nothing to continue: make at least two lines run all the way down to y=${canvasHeight}`,
                );
            }
            const score = lowestY - 1000 * complaints.length;
            if (score > bestScore) {
                best = { strokes, description };
                bestScore = score;
            }
            if (complaints.length === 0) return { strokes, description };
            logger.debug(`drawing bot attempt ${attempt} rejected: ${complaints.join("; ")}`);
            feedback = [
                new AIMessage(raw),
                new HumanMessage(`Answer again with the same subject, fixed: ${complaints.join(". Also, ")}.`),
            ];
        } catch (err) {
            lastErr = err as Error;
            logger.debug(`drawing bot completion attempt ${attempt} failed: ${lastErr.message}`);
            // No key, no credits, no access: another attempt cannot help
            if (/insufficient_quota|no credits|api key|401|403/i.test(lastErr.message)) break;
            feedback = raw
                ? [
                      new AIMessage(raw),
                      new HumanMessage(
                          `That answer could not be used (${lastErr.message}). Answer again as ONLY a JSON object with "subject" and a "shapes" array of new shapes.`,
                      ),
                  ]
                : [];
        }
    }
    if (best) {
        logger.warn("DrawingBot answers were never accepted; using the best attempt");
        return best;
    }
    throw new Error(`completePanel failed after ${attempts} attempt(s): ${lastErr?.message}`);
}
