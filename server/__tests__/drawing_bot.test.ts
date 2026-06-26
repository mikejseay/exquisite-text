import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    extractHintEnd,
    OVERLAP,
    PANEL_HEIGHT,
    PANEL_WIDTH,
    processModelStrokes,
    stripHintEcho,
} from "modules/drawing_bot";
import type { Point } from "shared/types/types";

// These tests encode the exquisite-corpse invariant deterministically, so the
// drawing bot is correct regardless of what the LLM returns:
//   1. A player sees ONLY the bottom OVERLAP band of the previous panel
//      (extractHintEnd), never the rest of the image.
//   2. A player's submitted strokes never re-emit the carried-over edge
//      (stripHintEcho / processModelStrokes), so nothing is "copied down".

const BAND_BOTTOM = Math.round(OVERLAP * PANEL_HEIGHT); // 60 px

function pt(x: number, y: number): Point {
    return { x, y, lineWidth: 3, color: "#7F7F7F" };
}
function stroke(...xy: Array<[number, number]>): Point[] {
    return xy.map(([x, y]) => pt(x, y));
}

describe("extractHintEnd — only the edge is shown (input guarantee)", () => {
    it("returns nothing for an empty previous panel", () => {
        assert.deepEqual(extractHintEnd([]), []);
    });

    it("drops strokes that live entirely above the overlap band", () => {
        // A stroke high in the previous panel must NOT be visible to the next player
        const prev = [stroke([100, 10], [120, 30], [140, 50])]; // all y < cutoff (240)
        assert.deepEqual(extractHintEnd(prev), []);
    });

    it("keeps only the bottom band and translates it to the top of a fresh panel", () => {
        // cutoff = (1 - OVERLAP) * PANEL_HEIGHT = 240
        // One stroke crossing from above the band into it; only the in-band tail survives
        const prev = [stroke([10, 200], [10, 250], [10, 290])];
        const hint = extractHintEnd(prev);
        const flat = hint.flat();
        // Every surviving point sits in the top band of the NEW panel (y in [0, bandBottom])
        for (const p of flat) {
            assert.ok(p.y >= 0 && p.y <= BAND_BOTTOM + 1, `y=${p.y} should be within the top band`);
        }
        // The point that was at y=250 (10 past cutoff) lands at y=10; y=290 lands at y=50
        assert.deepEqual(
            flat.map((p) => p.y).sort((a, b) => a - b),
            [10, 50],
        );
    });

    it("splits a stroke that dips out of the band into separate segments", () => {
        const cutoff = (1 - OVERLAP) * PANEL_HEIGHT; // 240
        // in-band, leaves band, re-enters band -> two segments
        const prev = [stroke([0, cutoff + 5], [0, cutoff - 50], [0, cutoff + 8])];
        const hint = extractHintEnd(prev);
        assert.equal(hint.length, 2, "should split into two in-band segments");
        for (const seg of hint) for (const p of seg) assert.ok(p.y >= 0 && p.y <= BAND_BOTTOM + 1);
    });

    it("the rest of a tall image never leaks through, no matter how many strokes", () => {
        // Simulate a busy previous panel; only marks in the bottom band may pass
        const prev: Point[][] = [];
        for (let y = 0; y < PANEL_HEIGHT; y += 10) prev.push(stroke([5, y], [15, y]));
        const hint = extractHintEnd(prev);
        const cutoff = (1 - OVERLAP) * PANEL_HEIGHT;
        // Count source points that were genuinely in the band
        const inBandSource = prev.flat().filter((p) => p.y >= cutoff).length;
        assert.equal(hint.flat().length, inBandSource);
        // And every survivor is now in the top band
        for (const p of hint.flat()) assert.ok(p.y <= BAND_BOTTOM + 1);
    });
});

describe("stripHintEcho — the edge is never copied back (output guarantee)", () => {
    const hint = [stroke([10, 5], [20, 10], [30, 15])]; // a hint stroke in the top band

    it("removes a stroke that is a verbatim copy of a hint stroke (the reported bug)", () => {
        const echoed = [stroke([10, 5], [20, 10], [30, 15])];
        assert.deepEqual(stripHintEcho(echoed, hint, BAND_BOTTOM), []);
    });

    it("removes a near-copy within epsilon (model re-emits with tiny drift)", () => {
        const echoed = [stroke([11, 6], [21, 9], [29, 16])];
        assert.deepEqual(stripHintEcho(echoed, hint, BAND_BOTTOM), []);
    });

    it("keeps a genuinely new stroke that continues downward out of the band", () => {
        const newStroke = [stroke([30, 15], [40, 120], [50, 260])]; // starts at edge, goes DOWN
        const result = stripHintEcho(newStroke, hint, BAND_BOTTOM);
        assert.equal(result.length, 1);
    });

    it("keeps new strokes drawn elsewhere in the panel", () => {
        const elsewhere = [stroke([400, 200], [450, 250])];
        assert.deepEqual(stripHintEcho(elsewhere, hint, BAND_BOTTOM), elsewhere);
    });

    it("removes band-confined tracing even if point count differs from the hint", () => {
        // Model traces over the hint with extra interpolated points, all in-band
        const traced = [stroke([10, 5], [15, 7], [20, 10], [25, 12], [30, 15])];
        assert.deepEqual(stripHintEcho(traced, hint, BAND_BOTTOM), []);
    });

    it("is a no-op when there is no hint (first panel)", () => {
        const first = [stroke([100, 100], [200, 200])];
        assert.deepEqual(stripHintEcho(first, [], BAND_BOTTOM), first);
    });

    it("strips echoes but preserves new strokes in a mixed response", () => {
        const mixed = [
            stroke([10, 5], [20, 10], [30, 15]), // echo -> dropped
            stroke([30, 15], [60, 180], [90, 280]), // new, goes down -> kept
        ];
        const result = stripHintEcho(mixed, hint, BAND_BOTTOM);
        assert.equal(result.length, 1);
        assert.equal(result[0][2].y, 280);
    });
});

describe("processModelStrokes — end-to-end output contract", () => {
    const hintPairs = [stroke([10, 5], [20, 10], [30, 15])];
    const baseOpts = {
        canvasWidth: PANEL_WIDTH,
        canvasHeight: PANEL_HEIGHT,
        bandBottom: BAND_BOTTOM,
        maxStrokes: 3,
        color: "#7F7F7F",
        lineWidth: 3,
    };

    it("clamps out-of-bounds coordinates into the panel", () => {
        const raw = [
            [
                [-50, -20],
                [9999, 9999],
            ],
        ];
        const out = processModelStrokes(raw, [], baseOpts);
        assert.equal(out.length, 1);
        assert.deepEqual(out[0][0], { x: 0, y: 0, lineWidth: 3, color: "#7F7F7F" });
        assert.deepEqual(out[0][1], { x: PANEL_WIDTH, y: PANEL_HEIGHT, lineWidth: 3, color: "#7F7F7F" });
    });

    it("ADVERSARIAL: a model that echoes the entire hint produces zero strokes", () => {
        const raw = [
            [
                [10, 5],
                [20, 10],
                [30, 15],
            ],
        ];
        const out = processModelStrokes(raw, hintPairs, baseOpts);
        assert.deepEqual(out, [], "echoed hint must be fully stripped");
    });

    it("honors maxStrokes after echo-stripping", () => {
        const raw = [
            [
                [100, 100],
                [110, 200],
            ],
            [
                [200, 100],
                [210, 200],
            ],
            [
                [300, 100],
                [310, 200],
            ],
            [
                [400, 100],
                [410, 200],
            ],
        ];
        const out = processModelStrokes(raw, hintPairs, { ...baseOpts, maxStrokes: 2 });
        assert.equal(out.length, 2);
    });

    it("assigns the configured color and lineWidth to every point", () => {
        const raw = [
            [
                [100, 100],
                [110, 200],
            ],
        ];
        const out = processModelStrokes(raw, [], { ...baseOpts, color: "#123456", lineWidth: 7 });
        for (const p of out.flat()) {
            assert.equal(p.color, "#123456");
            assert.equal(p.lineWidth, 7);
        }
    });
});

describe("full-stack invariant: bot panels never overlap the carried edge", () => {
    // Simulate the server pipeline without the network: given a previous panel,
    // the next contribution = processModelStrokes(model output, extractHintEnd(prev)).
    // Assert the contribution shares no geometry with the previous panel's band.
    it("a stacked sequence never reproduces the prior panel's bottom edge", () => {
        const prevPanel = [
            stroke([50, 250], [120, 270], [200, 290]), // bottom-band marks that carry over
            stroke([300, 20], [320, 40]), // top marks that must NOT carry over
        ];
        const hint = extractHintEnd(prevPanel);

        // A well-behaved model: continues from the edge downward (kept)
        // plus, adversarially, echoes the hint band (must be stripped)
        const modelRaw = [
            [
                [10, 10],
                [60, 150],
                [110, 280],
            ], // genuine continuation
            hint[0].map((p) => [Math.round(p.x), Math.round(p.y)]), // echo of carried edge
        ];
        const contribution = processModelStrokes(modelRaw, hint, {
            canvasWidth: PANEL_WIDTH,
            canvasHeight: PANEL_HEIGHT,
            bandBottom: BAND_BOTTOM,
            maxStrokes: 5,
            color: "#7F7F7F",
            lineWidth: 3,
        });

        // Exactly the genuine stroke survives
        assert.equal(contribution.length, 1);
        // None of the carried-edge points appear in the contribution's band region
        const edgePts = hint.flat();
        for (const p of contribution.flat()) {
            const isEcho = edgePts.some(
                (e) => Math.abs(e.x - p.x) <= 3 && Math.abs(e.y - p.y) <= 3 && p.y <= BAND_BOTTOM + 3,
            );
            assert.ok(!isEcho, `contribution point (${p.x},${p.y}) must not echo the carried edge`);
        }
    });
});
