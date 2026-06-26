import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { completePanel, extractHintEnd, OVERLAP, PANEL_HEIGHT, PANEL_WIDTH } from "modules/drawing_bot";
import type { Point } from "shared/types/types";

// Self-play harness: two drawing bots play a full exquisite-corpse game
// against each other (the bot "plays with itself"), and we ASSERT the game's
// invariants on the live model output — not just the pure helpers. This is the
// end-to-end confirmation that what the user saw ("copied down the page")
// cannot happen, even with a real LLM in the loop.
//
// Invariants checked on every contribution after the first:
//   I1  The bot is only ever shown the bottom OVERLAP band of the previous
//       panel (we verify the hint we pass in is band-confined).
//   I2  No submitted stroke re-traces the carried-over edge (no echo): every
//       submitted stroke that sits in the band must depart from the hint path.
//   I3  The contribution is non-empty and stays within panel bounds.
//   I4  The contribution leaves marks near the bottom so the next player has
//       something to continue (a "connection" for the next fold).
//
// Run from the server directory:
//   node --env-file-if-exists=.env --import tsx -r tsconfig-paths/register scripts/selfPlayDrawing.ts
// (or: yarn selfplay:drawing) then open the printed HTML to view the composite.

const N_PANELS = 3; // matches DrawingRoom's nContributions
const BAND_BOTTOM = Math.round(OVERLAP * PANEL_HEIGHT);
const ECHO_EPS = 4; // slightly looser than the lib's 3px, to avoid false alarms
const PALETTE = ["#1d4ed8", "#b91c1c", "#15803d", "#a21caf"];

type Check = { name: string; pass: boolean; detail: string };

function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function pointLiesOnHint(p: Point, hint: Point[][], eps: number): boolean {
    for (const h of hint) {
        if (h.length === 1) {
            if (Math.hypot(p.x - h[0].x, p.y - h[0].y) <= eps) return true;
            continue;
        }
        for (let i = 0; i < h.length - 1; i++) {
            if (pointToSegmentDistance(p, h[i], h[i + 1]) <= eps) return true;
        }
    }
    return false;
}

// A "seed" first panel so the bots have something to riff on. The bot itself
// could draw it, but a fixed seed makes runs comparable.
function seedPanel(): Point[][] {
    const mk = (x: number, y: number): Point => ({ x, y, lineWidth: 3, color: "#7F7F7F" });
    // A simple shape whose bottom edge dips into the carry band (y >= 240)
    return [
        [mk(300, 60), mk(340, 140), mk(320, 250), mk(300, 285)],
        [mk(360, 250), mk(380, 280)],
    ];
}

function checkContribution(strokes: Point[][], hint: Point[][]): Check[] {
    const checks: Check[] = [];

    // I1: the hint we showed the bot is band-confined (input guarantee)
    const hintMaxY = Math.max(0, ...hint.flat().map((p) => p.y));
    checks.push({
        name: "I1 hint is only the edge band",
        pass: hint.length === 0 || hintMaxY <= BAND_BOTTOM + ECHO_EPS,
        detail: `hint max y=${hintMaxY.toFixed(0)} (band bottom ${BAND_BOTTOM})`,
    });

    // I2: no submitted stroke is a band-confined echo of the hint
    const echoStrokes = strokes.filter((s) =>
        s.every((p) => p.y <= BAND_BOTTOM + ECHO_EPS && pointLiesOnHint(p, hint, ECHO_EPS)),
    );
    checks.push({
        name: "I2 no carried-edge echo",
        pass: echoStrokes.length === 0,
        detail: `${echoStrokes.length}/${strokes.length} strokes re-traced the carried edge`,
    });

    // I3: non-empty and in bounds
    const flat = strokes.flat();
    const inBounds = flat.every((p) => p.x >= 0 && p.x <= PANEL_WIDTH && p.y >= 0 && p.y <= PANEL_HEIGHT);
    checks.push({
        name: "I3 non-empty and in bounds",
        pass: strokes.length > 0 && inBounds,
        detail: `${strokes.length} strokes, ${flat.length} pts, inBounds=${inBounds}`,
    });

    // I4: leaves a connection near the bottom for the next player
    const maxY = Math.max(0, ...flat.map((p) => p.y));
    checks.push({
        name: "I4 leaves a bottom connection",
        pass: maxY >= PANEL_HEIGHT * (1 - OVERLAP) - ECHO_EPS,
        detail: `lowest mark y=${maxY.toFixed(0)} (needs >= ${(PANEL_HEIGHT * (1 - OVERLAP)).toFixed(0)})`,
    });

    return checks;
}

function strokesToSvg(strokes: Point[][], yOffset: number): string {
    return strokes
        .map((s) => {
            const pts = s.map((p) => `${p.x.toFixed(1)},${(p.y + yOffset).toFixed(1)}`).join(" ");
            const color = s[0]?.color ?? "#000";
            return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
        })
        .join("\n    ");
}

async function main() {
    if (!process.env.OPENAI_API_KEY) {
        console.error("OPENAI_API_KEY is not set. Ensure server/.env has it, then re-run.");
        process.exit(1);
    }

    const sessionId = `selfplay-${Date.now()}`;
    const panels: Point[][][] = [seedPanel()];
    const allChecks: Array<{ panel: number; checks: Check[]; description: string }> = [];

    console.log(`\n=== Self-play exquisite-corpse drawing (${N_PANELS} panels) ===`);
    console.log("Panel 0: seed shape (fixed)\n");

    for (let i = 1; i < N_PANELS; i++) {
        const prev = panels[i - 1];
        const hint = extractHintEnd(prev); // EXACTLY what a player is shown
        const { strokes, description } = await completePanel(hint, {
            sessionId: `${sessionId}-${i}`, // fresh session per panel (per-drawing memory)
            canvasWidth: PANEL_WIDTH,
            canvasHeight: PANEL_HEIGHT,
            overlap: OVERLAP,
            color: PALETTE[i % PALETTE.length],
        });
        const checks = checkContribution(strokes, hint);
        allChecks.push({ panel: i, checks, description });
        panels.push(strokes);

        console.log(`Panel ${i}: "${description}"`);
        console.log(`  shown hint: ${hint.length} stroke(s) from the carried edge`);
        console.log(`  drew: ${strokes.length} stroke(s), ${strokes.flat().length} pts`);
        for (const c of checks) console.log(`  ${c.pass ? "✔" : "✖"} ${c.name} — ${c.detail}`);
        console.log("");
    }

    // Render the composite (panels stacked with the OVERLAP, like the real End screen)
    const step = PANEL_HEIGHT * (1 - OVERLAP);
    const totalH = step * (N_PANELS - 1) + PANEL_HEIGHT;
    const composite = panels.map((p, i) => strokesToSvg(p, i * step)).join("\n    ");
    const sideBySide = panels
        .map(
            (p, i) =>
                `<figure><figcaption>Panel ${i}${i === 0 ? " (seed)" : ""}</figcaption>
  <svg viewBox="0 0 ${PANEL_WIDTH} ${PANEL_HEIGHT}" width="333" height="150" style="background:#fff;border:1px solid #ccc">
    <rect x="0" y="0" width="${PANEL_WIDTH}" height="${BAND_BOTTOM}" fill="#eef" />
    ${strokesToSvg(p, 0)}
  </svg></figure>`,
        )
        .join("\n");

    const allPass = allChecks.every((p) => p.checks.every((c) => c.pass));
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Self-play drawing</title>
<style>body{font-family:system-ui,sans-serif;margin:2rem;color:#222}figure{margin:0 0 1rem}figcaption{font-size:.8rem;color:#666}.row{display:flex;gap:1rem;flex-wrap:wrap}.verdict{font-weight:bold;font-size:1.1rem}.pass{color:#15803d}.fail{color:#b91c1c}</style>
</head><body>
<h1>Self-play exquisite-corpse drawing</h1>
<p class="verdict ${allPass ? "pass" : "fail"}">${allPass ? "ALL INVARIANTS PASS" : "INVARIANT FAILURE"}</p>
<p>The blue band at each panel's top is the carry-over zone (the only thing the next player sees). A correct game never re-draws that band's content as a new contribution.</p>
<h2>Composite (stacked with overlap, as on the End screen)</h2>
<svg viewBox="0 0 ${PANEL_WIDTH} ${totalH}" width="400" height="${(400 / PANEL_WIDTH) * totalH}" style="background:#fff;border:1px solid #999">
    ${composite}
</svg>
<h2>Per-panel</h2>
<div class="row">${sideBySide}</div>
</body></html>`;

    const outPath = resolve(process.cwd(), "self-play-drawing.html");
    writeFileSync(outPath, html);

    console.log(`${allPass ? "✔ ALL INVARIANTS PASS" : "✖ INVARIANT FAILURE"}`);
    console.log(`Wrote ${outPath}`);
    process.exit(allPass ? 0 : 1);
}

main();
