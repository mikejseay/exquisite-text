import { randomUUID } from "node:crypto";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { drawSystemPrompt, drawUserPrompt } from "llm_utils/prompts";
import { drawingIDToMessageHistory } from "modules/globals";
import type { Point } from "shared/types/types";
import { logger } from "utilities/loggerUtils";

// Vector analog of poem_bot.completeHalfLine. Given the strokes drawn so
// far (the "hint" passed from the previous editor), the model returns a
// set of NEW strokes that continue the drawing. We mirror poem_bot's
// idiom: prompt -> model -> parse -> validate with a small retry loop.
// No zod / withStructuredOutput, to stay compatible with the pinned
// @langchain/openai version and add no dependencies.
//
// Exquisite corpse rule (the surrealists' fold-over game): a player sees
// ONLY the connecting lines at the edge of the previous section, never the
// rest. We enforce that with TWO deterministic guarantees, neither of which
// relies on the model behaving:
//   1. Input  — extractHintEnd() shows the model only the bottom OVERLAP
//      band of the previous panel. The rest of the image never reaches it.
//   2. Output — stripHintEcho() removes any stroke the model parrots back
//      from that band, so the carried-over edge can never be re-emitted as
//      the bot's own contribution (which is what made it look "copied down").
//
// Memory is scoped per-drawing: pass the Drawing's ID as sessionId and the
// bot remembers its own contributions within that drawing only.

// Panel geometry, the single source of truth (mirrors the client Canvas
// constants PANEL_WIDTH_MIN / PANEL_HEIGHT_MIN / OVERLAP). A panel is a wide,
// short strip; players stack vertically, each seeing only the bottom OVERLAP
// band of the previous panel, repositioned to the top of their own panel.
export const PANEL_WIDTH = 667;
export const PANEL_HEIGHT = 300;
export const OVERLAP = 0.2;

// Distance (px) within which a model point counts as "the same" as a hint
// point. Hint coords are rounded to integers before the model sees them, so a
// small tolerance absorbs the model re-emitting them with minor drift.
const ECHO_EPSILON = 3;

export type PanelCompletion = {
    strokes: Point[][];
    description: string;
};

export type CompletePanelOptions = {
    sessionId?: string; // the Drawing's ID; omit for a fresh, ephemeral session
    canvasWidth?: number;
    canvasHeight?: number;
    overlap?: number; // fraction of the top occupied by the previous player's "end"
    maxStrokes?: number;
    color?: string;
    lineWidth?: number;
    maxTries?: number;
};

// ─── Pure geometry (network-free, unit-tested) ──────────────────

// Reproduce, in vector form, what a human editor is shown: only the bottom
// OVERLAP strip of the previous panel, translated up so it sits at the top of
// a fresh panel. Strokes (or stroke segments) above the strip are dropped, the
// same way the client raster-clips everything above the overlap band. This is
// the INPUT guarantee: the model can never see the rest of the image.
export function extractHintEnd(
    prevPanel: Point[][],
    panelHeight: number = PANEL_HEIGHT,
    overlap: number = OVERLAP,
): Point[][] {
    const cutoff = (1 - overlap) * panelHeight; // y >= cutoff is the visible "end"
    const result: Point[][] = [];
    for (const stroke of prevPanel) {
        let segment: Point[] = [];
        for (const p of stroke) {
            if (p.y >= cutoff) {
                segment.push({ ...p, y: p.y - cutoff });
            } else if (segment.length > 0) {
                result.push(segment);
                segment = [];
            }
        }
        if (segment.length > 0) result.push(segment);
    }
    return result;
}

// Shortest distance from point P to line segment AB. This is the correct
// primitive for "does this point lie on the hint path?" — point-to-vertex
// distance misses interpolated points the model may insert while tracing.
function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y); // A === B
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

// Is point P within epsilon of the hint POLYLINE (any segment of any stroke)?
function pointLiesOnHint(p: Point, hint: Point[][], epsilon: number): boolean {
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

// OUTPUT guarantee: drop strokes that merely parrot the carried-over edge
// back. A stroke is regurgitation when EVERY one of its points both (a) lies
// on the hint polyline and (b) stays inside the carried band. Such a stroke
// adds nothing new — it just re-traces the edge, which is what made earlier
// panels look "copied down". A genuine continuation leaves the band (has at
// least one point below it) or departs from the hint path, so it survives.
export function stripHintEcho(
    strokes: Point[][],
    hint: Point[][],
    bandBottom: number,
    epsilon: number = ECHO_EPSILON,
): Point[][] {
    if (hint.length === 0) return strokes;
    return strokes.filter((s) => {
        const isRegurgitation = s.every((p) => p.y <= bandBottom + epsilon && pointLiesOnHint(p, hint, epsilon));
        return !isRegurgitation;
    });
}

// Turn raw [x,y] pairs from the model into clamped, styled, echo-free strokes.
// Pure and deterministic so it can be unit-tested without the network.
export function processModelStrokes(
    rawStrokes: number[][][],
    hintPairs: Point[][],
    opts: {
        canvasWidth: number;
        canvasHeight: number;
        bandBottom: number;
        maxStrokes: number;
        color: string;
        lineWidth: number;
        epsilon?: number;
    },
): Point[][] {
    const clampX = (v: number) => Math.max(0, Math.min(opts.canvasWidth, v));
    const clampY = (v: number) => Math.max(0, Math.min(opts.canvasHeight, v));
    const styled: Point[][] = rawStrokes.map((stroke) =>
        stroke.map(([x, y]) => ({ x: clampX(x), y: clampY(y), lineWidth: opts.lineWidth, color: opts.color })),
    );
    const deEchoed = stripHintEcho(styled, hintPairs, opts.bandBottom, opts.epsilon);
    return deEchoed.slice(0, opts.maxStrokes);
}

// ─── Model plumbing ─────────────────────────────────────────────

const drawPrompt = ChatPromptTemplate.fromMessages([
    ["system", drawSystemPrompt],
    ["placeholder", "{chat_history}"],
    ["human", drawUserPrompt],
]);
const drawModel = new ChatOpenAI({ model: "gpt-4o", temperature: 0.9 });
const parser = new StringOutputParser();
const drawChain = new RunnableWithMessageHistory({
    runnable: drawPrompt.pipe(drawModel).pipe(parser),
    getMessageHistory: async (sessionId) => {
        if (drawingIDToMessageHistory[sessionId] === undefined) {
            drawingIDToMessageHistory[sessionId] = new InMemoryChatMessageHistory();
        }
        return drawingIDToMessageHistory[sessionId];
    },
    inputMessagesKey: "input",
    historyMessagesKey: "chat_history",
});

function describeBoundingBox(hint: Point[][]): string {
    const points = hint.flat();
    if (points.length === 0) return "empty canvas";
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    return `x ${Math.round(Math.min(...xs))}-${Math.round(Math.max(...xs))}, y ${Math.round(Math.min(...ys))}-${Math.round(Math.max(...ys))}`;
}

// The model only ever reasons about position. Color and width are ours to
// assign, so we strip them from the hint to keep the prompt compact. The
// rounded pairs we send are exactly what stripHintEcho later compares against.
function hintToPairs(hint: Point[][]): number[][][] {
    return hint.map((stroke) => stroke.map((p) => [Math.round(p.x), Math.round(p.y)]));
}

function pairsToPoints(pairs: number[][][], lineWidth: number, color: string): Point[][] {
    return pairs.map((stroke) => stroke.map(([x, y]) => ({ x, y, lineWidth, color })));
}

// Tolerate code fences or stray prose around the JSON object.
function extractJSON(raw: string): unknown {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) {
        throw new Error("no JSON object found in model response");
    }
    return JSON.parse(raw.slice(start, end + 1));
}

type RawCompletion = { description?: unknown; strokes?: unknown };

function isPairArray(value: unknown): value is number[][][] {
    return (
        Array.isArray(value) &&
        value.every(
            (stroke) =>
                Array.isArray(stroke) &&
                stroke.length > 0 &&
                stroke.every(
                    (pt) =>
                        Array.isArray(pt) && pt.length >= 2 && typeof pt[0] === "number" && typeof pt[1] === "number",
                ),
        )
    );
}

export async function completePanel(hint: Point[][], opts: CompletePanelOptions = {}): Promise<PanelCompletion> {
    const sessionId = opts.sessionId ?? randomUUID();
    const canvasWidth = opts.canvasWidth ?? PANEL_WIDTH;
    const canvasHeight = opts.canvasHeight ?? PANEL_HEIGHT;
    const overlap = opts.overlap ?? OVERLAP;
    const maxStrokes = opts.maxStrokes ?? 3;
    // Match the human pen so the bot's panel blends with the rest of the drawing
    const color = opts.color ?? "#7F7F7F";
    const lineWidth = opts.lineWidth ?? 3;
    const maxTries = opts.maxTries ?? 3;

    const bandBottom = Math.round(overlap * canvasHeight);
    // The rounded hint, in Point form, is the exact geometry the model saw and
    // therefore the exact geometry we strip back out of its answer.
    const hintPairs = pairsToPoints(hintToPairs(hint), lineWidth, color);
    // The bottom carry zone the model must reach so the next player has an edge
    // to continue from (mirrors the I4 invariant in the self-play harness).
    const bottomZone = Math.round((1 - overlap) * canvasHeight);
    const promptVars = {
        canvas: `${canvasWidth} wide by ${canvasHeight} tall`,
        hint_band: hint.length > 0 ? `the top ${bandBottom} pixels (y 0-${bandBottom})` : "nothing yet",
        n_strokes: hint.length.toString(),
        bbox: describeBoundingBox(hint),
        input: JSON.stringify(hintToPairs(hint)),
        max_strokes: maxStrokes.toString(),
        panel_bottom: canvasHeight.toString(),
        bottom_zone: bottomZone.toString(),
    };
    const config = { configurable: { sessionId } };

    // A contribution "connects" if some stroke reaches the bottom carry zone,
    // so the next player has an edge to continue from (the relay rule). We
    // prefer a connecting result, but keep the best non-connecting one as a
    // fallback so a stubborn model never dead-ends the whole turn.
    const reachesBottomZone = (strokes: Point[][]) => strokes.some((s) => s.some((p) => p.y >= bottomZone));
    let best: PanelCompletion | undefined;
    let bestLowestY = -1;

    let lastErr: Error | undefined;
    for (let attempt = 1; attempt <= maxTries; attempt++) {
        try {
            const raw = await drawChain.invoke(promptVars, config);
            logger.debug(`drawing bot raw completion (attempt ${attempt}):\n${raw}`);
            const parsed = extractJSON(raw) as RawCompletion;
            if (!isPairArray(parsed.strokes) || parsed.strokes.length === 0) {
                throw new Error("response had no valid strokes");
            }
            const strokes = processModelStrokes(parsed.strokes, hintPairs, {
                canvasWidth,
                canvasHeight,
                bandBottom,
                maxStrokes,
                color,
                lineWidth,
            });
            // If everything the model returned was an echo of the hint, it
            // contributed nothing new. Retry rather than submit a blank or a
            // copy — but never fall back to emitting the hint itself.
            if (strokes.length === 0) {
                throw new Error("model only echoed the hint, no new strokes");
            }
            const description = typeof parsed.description === "string" ? parsed.description : "";

            // Best result so far = the one whose marks reach furthest down.
            const lowestY = Math.max(...strokes.flat().map((p) => p.y));
            if (lowestY > bestLowestY) {
                best = { strokes, description };
                bestLowestY = lowestY;
            }
            // Accept immediately once it connects to the bottom; otherwise retry
            // to coax the model lower, keeping the best as a fallback.
            if (reachesBottomZone(strokes)) {
                return { strokes, description };
            }
            logger.debug(
                `drawing bot attempt ${attempt} did not reach bottom zone (lowest y=${lowestY}, need ${bottomZone}), retrying`,
            );
        } catch (err) {
            lastErr = err as Error;
            logger.debug(`drawing bot completion attempt ${attempt} failed: ${lastErr.message}`);
        }
    }
    // No attempt reached the bottom zone; submit the best (furthest-down) one
    // rather than failing the turn, so the game still advances.
    if (best) {
        logger.warn(`DrawingBot never reached the bottom zone; using best attempt (lowest y=${bestLowestY})`);
        return best;
    }
    throw new Error(`completePanel failed after ${maxTries} attempts: ${lastErr?.message}`);
}
