import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    completePanel,
    dominantColor,
    extractHintEnd,
    fakeCompletion,
    medianLineWidth,
    OVERLAP,
    PANEL_HEIGHT,
    PANEL_WIDTH,
    parseCompletion,
    positionOf,
    shapesToStrokes,
    stripHintEcho,
} from "modules/drawing_bot";
import { findAnchors } from "modules/drawing_geometry";
import type { Point } from "shared/types/types";

// These tests encode the exquisite-corpse invariants deterministically, so the
// drawing bot is correct regardless of what the LLM returns:
//   1. A player sees ONLY the bottom OVERLAP band of the previous panel
//      (extractHintEnd), never the rest of the image
//   2. A player's submitted strokes never re-emit the carried-over edge
//      (stripHintEcho / shapesToStrokes), so nothing is "copied down"
//   3. Shapes connect to the carried-over exits and stay inside the panel

const BAND_BOTTOM = Math.round(OVERLAP * PANEL_HEIGHT); // 60 px

function pt(x: number, y: number): Point {
    return { x, y, lineWidth: 3, color: "#7F7F7F" };
}
function stroke(...xy: Array<[number, number]>): Point[] {
    return xy.map(([x, y]) => pt(x, y));
}
const withFake = async (fn: () => Promise<void>) => {
    const prev = process.env.DRAWING_BOT_FAKE;
    process.env.DRAWING_BOT_FAKE = "1";
    try {
        await fn();
    } finally {
        if (prev === undefined) delete process.env.DRAWING_BOT_FAKE;
        else process.env.DRAWING_BOT_FAKE = prev;
    }
};
const baseOpts = {
    canvasWidth: PANEL_WIDTH,
    canvasHeight: PANEL_HEIGHT,
    bandBottom: BAND_BOTTOM,
    anchors: [],
    maxShapes: 16,
    color: "#7F7F7F",
    lineWidth: 3,
};

describe("extractHintEnd: only the edge is shown (input guarantee)", () => {
    it("returns nothing for an empty previous panel", () => {
        assert.deepEqual(extractHintEnd([]), []);
    });

    it("drops strokes that live entirely above the overlap band", () => {
        const prev = [stroke([100, 10], [120, 30], [140, 50])]; // all y < cutoff (240)
        assert.deepEqual(extractHintEnd(prev), []);
    });

    it("keeps only the bottom band and translates it to the top of a fresh panel", () => {
        const prev = [stroke([10, 200], [10, 250], [10, 290])];
        const flat = extractHintEnd(prev).flat();
        for (const p of flat) assert.ok(p.y >= 0 && p.y <= BAND_BOTTOM + 1, `y=${p.y} should be within the band`);
        // The entry point onto the band's top edge is interpolated, then the two in-band points follow
        assert.deepEqual(
            flat.map((p) => p.y).sort((a, b) => a - b),
            [0, 10, 50],
        );
    });

    it("a stroke drawn past the bottom edge is cut exactly at the edge", () => {
        const prev = [stroke([100, 250], [120, 350])];
        const [seg] = extractHintEnd(prev);
        assert.equal(seg.length, 2);
        assert.equal(seg[1].y, BAND_BOTTOM);
        assert.equal(seg[1].x, 110);
    });

    it("splits a stroke that dips out of the band into separate segments", () => {
        const cutoff = (1 - OVERLAP) * PANEL_HEIGHT; // 240
        const prev = [stroke([0, cutoff + 5], [0, cutoff - 50], [0, cutoff + 8])];
        const hint = extractHintEnd(prev);
        assert.equal(hint.length, 2, "should split into two in-band segments");
    });

    it("the rest of a tall image never leaks through, no matter how many strokes", () => {
        const prev: Point[][] = [];
        for (let y = 0; y < PANEL_HEIGHT; y += 10) prev.push(stroke([5, y], [15, y]));
        const hint = extractHintEnd(prev);
        const cutoff = (1 - OVERLAP) * PANEL_HEIGHT;
        const inBandSource = prev.flat().filter((p) => p.y >= cutoff).length;
        assert.equal(hint.flat().length, inBandSource);
    });

    it("applies the human's eraser before showing the band to the bot", () => {
        const mark = stroke([300, 250], [300, 290]);
        const eraser: Point[] = [
            { x: 300, y: 260, lineWidth: 30, color: "!e" },
            { x: 300, y: 290, lineWidth: 30, color: "!e" },
        ];
        const hint = extractHintEnd([mark, eraser]);
        assert.deepEqual(hint, [], "an erased mark must not reach the model");
    });
});

describe("stripHintEcho: the edge is never copied back (output guarantee)", () => {
    const hint = [stroke([10, 5], [20, 10], [30, 15])];

    it("removes a stroke that is a verbatim copy of a hint stroke", () => {
        assert.deepEqual(stripHintEcho([stroke([10, 5], [20, 10], [30, 15])], hint, BAND_BOTTOM), []);
    });

    it("removes a near-copy within epsilon (model re-emits with tiny drift)", () => {
        assert.deepEqual(stripHintEcho([stroke([11, 6], [21, 9], [29, 16])], hint, BAND_BOTTOM), []);
    });

    it("keeps a genuinely new stroke that continues downward out of the band", () => {
        const newStroke = [stroke([30, 15], [40, 120], [50, 260])];
        assert.equal(stripHintEcho(newStroke, hint, BAND_BOTTOM).length, 1);
    });

    it("keeps new strokes drawn elsewhere in the panel", () => {
        const elsewhere = [stroke([400, 200], [450, 250])];
        assert.deepEqual(stripHintEcho(elsewhere, hint, BAND_BOTTOM), elsewhere);
    });

    it("removes band-confined tracing even if point count differs from the hint", () => {
        const traced = [stroke([10, 5], [15, 7], [20, 10], [25, 12], [30, 15])];
        assert.deepEqual(stripHintEcho(traced, hint, BAND_BOTTOM), []);
    });

    it("is a no-op when there is no hint (first panel)", () => {
        const first = [stroke([100, 100], [200, 200])];
        assert.deepEqual(stripHintEcho(first, [], BAND_BOTTOM), first);
    });
});

describe("parseCompletion: the model's JSON program", () => {
    it("reads subject and shapes, dropping malformed shapes", () => {
        const raw = `Sure! {"subject":"a cat head","shapes":[{"type":"circle","cx":300,"cy":100,"r":50},{"type":"blob"},{"type":"line","x1":1,"y1":2,"x2":3,"y2":4}]}`;
        const { shapes, description, invalid } = parseCompletion(raw);
        assert.equal(description, "a cat head");
        assert.equal(shapes.length, 2);
        assert.equal(invalid, 1);
    });

    it("accepts the older raw-strokes form as polylines", () => {
        const raw = `{"description":"legacy","strokes":[[[0,0],[10,10],[20,30]]]}`;
        const { shapes, description } = parseCompletion(raw);
        assert.equal(description, "legacy");
        assert.equal(shapes.length, 1);
        assert.equal(shapes[0].type, "polyline");
    });

    it("accepts shapes keyed by name and code-fenced JSON", () => {
        const raw =
            '```json\n{"subject":"x","shapes":{"head":{"type":"circle","cx":1,"cy":2,"r":3},"neck":{"type":"line","x1":0,"y1":0,"x2":1,"y2":1}}}\n```';
        const { shapes } = parseCompletion(raw);
        assert.equal(shapes.length, 2);
    });

    it("throws when there is no JSON object at all", () => {
        assert.throws(() => parseCompletion("I cannot draw"), /no JSON object/);
    });
});

describe("shapesToStrokes: end-to-end output contract", () => {
    it("expands shapes into dense strokes styled with the configured pen", () => {
        const out = shapesToStrokes([{ type: "ellipse", cx: 300, cy: 150, rx: 60, ry: 40 }], [], {
            ...baseOpts,
            color: "#123456",
            lineWidth: 7,
        });
        assert.equal(out.length, 1);
        assert.ok(out[0].length >= 12, "an ellipse should be sampled densely");
        for (const p of out[0]) {
            assert.equal(p.color, "#123456");
            assert.equal(p.lineWidth, 7);
        }
    });

    it("clips shapes at the panel edge instead of squashing them onto it", () => {
        const out = shapesToStrokes([{ type: "line", x1: 300, y1: 250, x2: 300, y2: 400 }], [], baseOpts);
        const flat = out.flat();
        assert.ok(
            flat.every((p) => p.y <= PANEL_HEIGHT),
            "no point may lie below the panel",
        );
        assert.ok(
            Math.max(...flat.map((p) => p.y)) >= PANEL_HEIGHT - 5,
            "the line should still run to the bottom edge",
        );
    });

    it("splits a shape that leaves and re-enters the panel", () => {
        // A wide ellipse whose left and right ends poke out of the panel
        const out = shapesToStrokes([{ type: "ellipse", cx: 333, cy: 150, rx: 400, ry: 50 }], [], baseOpts);
        assert.ok(out.length >= 2, "the parts outside the panel are removed, leaving separate pieces");
        for (const p of out.flat()) assert.ok(p.x >= 0 && p.x <= PANEL_WIDTH);
    });

    it("snaps a continuation onto the carried-over exit so it visibly connects", () => {
        const hint = [stroke([310, 0], [305, 30], [300, 60])];
        const anchors = findAnchors(hint, BAND_BOTTOM);
        assert.equal(anchors.length, 1);
        // The model starts its body 12 px to the right of where the neck actually exits
        const out = shapesToStrokes([{ type: "line", x1: 312, y1: 62, x2: 260, y2: 290 }], hint, {
            ...baseOpts,
            anchors,
        });
        assert.equal(out.length, 1);
        assert.deepEqual({ x: out[0][0].x, y: out[0][0].y }, { x: 300, y: 60 });
    });

    it("ADVERSARIAL: a model that echoes the entire hint produces zero strokes", () => {
        const hint = [stroke([10, 5], [20, 10], [30, 15])];
        const out = shapesToStrokes(
            [
                {
                    type: "polyline",
                    points: [
                        { x: 10, y: 5 },
                        { x: 20, y: 10 },
                        { x: 30, y: 15 },
                    ],
                },
            ],
            hint,
            baseOpts,
        );
        assert.deepEqual(out, [], "echoed hint must be fully stripped");
    });

    it("honors maxShapes", () => {
        const shapes = Array.from({ length: 6 }, (_, i) => ({
            type: "line" as const,
            x1: 100 + i * 50,
            y1: 100,
            x2: 100 + i * 50,
            y2: 200,
        }));
        assert.equal(shapesToStrokes(shapes, [], { ...baseOpts, maxShapes: 4 }).length, 4);
    });
});

describe("the bot's pen mirrors the previous player", () => {
    it("uses the dominant colour and median width of the carried-over ink, or the default pen", () => {
        const blue = stroke([0, 0], [10, 10], [20, 20]).map((p) => ({ ...p, color: "#0000ff", lineWidth: 9 }));
        const red = stroke([0, 0], [10, 10]).map((p) => ({ ...p, color: "#ff0000", lineWidth: 2 }));
        assert.equal(dominantColor([blue, red]), "#0000ff");
        assert.equal(medianLineWidth([blue, red]), 9);
        assert.equal(dominantColor([]), "#7F7F7F");
        assert.ok(Math.abs(medianLineWidth([]) - Math.log(1.5) * 8) < 1e-9);
        assert.equal(medianLineWidth([stroke([0, 0], [1, 1]).map((p) => ({ ...p, lineWidth: 40 }))]), 12);
    });

    it("completePanel styles its strokes with that pen", () =>
        withFake(async () => {
            const prev = [stroke([300, 200], [300, 300]), stroke([360, 200], [360, 300])].map((s) =>
                s.map((p) => ({ ...p, color: "#123456", lineWidth: 6 })),
            );
            const { strokes } = await completePanel(extractHintEnd(prev), { panelIndex: 1, nPanels: 3 });
            for (const p of strokes.flat()) {
                assert.equal(p.color, "#123456");
                assert.equal(p.lineWidth, 6);
            }
        }));
});

describe("positionOf: where this panel sits in the picture", () => {
    it("maps panel indices onto top / middle / bottom", () => {
        assert.equal(positionOf(0, 3), "top");
        assert.equal(positionOf(1, 3), "middle");
        assert.equal(positionOf(2, 3), "bottom");
        assert.equal(positionOf(1, 2), "bottom");
        assert.equal(positionOf(3, 5), "middle");
    });
});

describe("completePanel in fake mode: the whole turn without the network", () => {
    it("the top panel leaves lines running to the bottom edge for the next player", () =>
        withFake(async () => {
            const { strokes, description } = await completePanel([], { panelIndex: 0, nPanels: 3 });
            assert.ok(description.length > 0);
            assert.ok(strokes.length >= 5);
            const lowest = Math.max(...strokes.flat().map((p) => p.y));
            assert.ok(lowest >= PANEL_HEIGHT * 0.9, `lowest y=${lowest} should reach the bottom`);
            for (const p of strokes.flat()) {
                assert.ok(p.x >= 0 && p.x <= PANEL_WIDTH && p.y >= 0 && p.y <= PANEL_HEIGHT);
            }
        }));

    it("the middle panel connects to the exits of the previous panel and hands on", () =>
        withFake(async () => {
            // A previous panel whose neck lines exit the bottom at x=300 and x=360
            const prev = [stroke([300, 200], [300, 300]), stroke([360, 200], [360, 300])];
            const hint = extractHintEnd(prev);
            const { strokes } = await completePanel(hint, { panelIndex: 1, nPanels: 3 });
            const starts = strokes.map((s) => s[0]);
            assert.ok(
                starts.some((p) => Math.abs(p.x - 300) < 1 && Math.abs(p.y - BAND_BOTTOM) < 1),
                "a stroke starts exactly at the left exit",
            );
            assert.ok(
                starts.some((p) => Math.abs(p.x - 360) < 1 && Math.abs(p.y - BAND_BOTTOM) < 1),
                "a stroke starts exactly at the right exit",
            );
            const lowest = Math.max(...strokes.flat().map((p) => p.y));
            assert.ok(lowest >= PANEL_HEIGHT * 0.9);
            // Nothing merely retraces the carried band
            assert.deepEqual(stripHintEcho(strokes, hint, BAND_BOTTOM).length, strokes.length);
        }));

    it("the bottom panel finishes the figure and never re-emits the hint", () =>
        withFake(async () => {
            const prev = [stroke([250, 100], [240, 300]), stroke([420, 100], [430, 300])];
            const hint = extractHintEnd(prev);
            const { strokes } = await completePanel(hint, { panelIndex: 2, nPanels: 3 });
            assert.ok(strokes.length >= 4);
            assert.equal(stripHintEcho(strokes, hint, BAND_BOTTOM).length, strokes.length);
        }));

    it("fakeCompletion is valid JSON with a shape program for every position", () => {
        for (const position of ["top", "middle", "bottom"] as const) {
            const { shapes, description } = parseCompletion(fakeCompletion(position, [], PANEL_WIDTH, PANEL_HEIGHT));
            assert.ok(shapes.length >= 5, `${position} should have shapes`);
            assert.ok(description.startsWith("fake:"));
        }
    });
});
