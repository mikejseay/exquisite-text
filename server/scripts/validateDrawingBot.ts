import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { completePanel, extractHintEnd, PANEL_HEIGHT, PANEL_WIDTH } from "modules/drawing_bot";
import { findAnchors } from "modules/drawing_geometry";
import { renderPanelPng } from "modules/drawing_render";
import { BAND_BOTTOM, checkContribution } from "scripts/drawingChecks";
import type { Point } from "shared/types/types";

// Validation harness for the drawing bot: one panel at a time, in the real
// panel geometry, against the kinds of strips a human actually hands over.
// Each scenario is a previous panel; the bot sees only its bottom band (as a
// player would) and must continue it. The report renders the strip, the
// exits we told the model about, and what it drew, so a human can judge
// whether the continuation really collaborates.
//
// Run from the server directory:
//   yarn validate:drawing                      (live model)
//   DRAWING_BOT_FAKE=1 yarn validate:drawing   (canned bot, checks the harness itself)
// then open the printed HTML path in a browser.

const AI_COLOR = "#1d4ed8";
const HINT_COLOR = "#7F7F7F";

const mk = (x: number, y: number, extra: Partial<Point> = {}): Point => ({
    x,
    y,
    lineWidth: 3,
    color: HINT_COLOR,
    ...extra,
});
const line = (...xy: Array<[number, number]>): Point[] => xy.map(([x, y]) => mk(x, y));

type Scenario = { name: string; expectation: string; prev: Point[][]; panelIndex: number };

const scenarios: Scenario[] = [
    {
        name: "Blank top panel",
        expectation: "the top of something, with lines running off the bottom",
        prev: [],
        panelIndex: 0,
    },
    {
        name: "Two neck lines, 60 px apart",
        expectation: "shoulders or a body growing out of the neck, two lines leaving the bottom",
        prev: [line([305, 180], [298, 240], [300, 300]), line([361, 180], [368, 240], [360, 300])],
        panelIndex: 1,
    },
    {
        name: "A wide body bottom with a belt",
        expectation: "hips and legs, or wheels, starting at the two far-apart sides",
        prev: [line([190, 100], [185, 300]), line([480, 100], [485, 300]), line([185, 270], [485, 270])],
        panelIndex: 1,
    },
    {
        name: "A head whose chin dips into the strip, no neck",
        expectation: "a neck or body hanging from the chin (the only loose end), not from the panel centre",
        prev: [
            Array.from({ length: 41 }, (_, i) => {
                const a = -Math.PI / 2 + (i / 40) * 2 * Math.PI;
                return mk(280 + 70 * Math.cos(a), 200 + 70 * Math.sin(a));
            }),
        ],
        panelIndex: 1,
    },
    {
        name: "A single stem in the middle",
        expectation: "one thing balanced on a stalk: a flower pot, a lollipop, a unicycle",
        prev: [line([333, 120], [333, 300])],
        panelIndex: 1,
    },
    {
        name: "A diagonal exiting down-right",
        expectation: "something that continues the slant: a tail, a slide, a leaning trunk",
        prev: [line([200, 150], [300, 260], [340, 300])],
        panelIndex: 1,
    },
    {
        name: "A scribble in the strip",
        expectation: "the bot copes with a messy hand-off and still continues from the exits",
        prev: [
            Array.from({ length: 60 }, (_, i) => mk(250 + i * 3, 262 + 18 * Math.sin(i / 2))),
            line([300, 230], [280, 300]),
            line([400, 230], [420, 300]),
        ],
        panelIndex: 1,
    },
    {
        name: "A fringe: eight strands crossing the bottom edge, 500 px wide",
        expectation:
            "one subject hanging from two of the strands, the rest tied off short (seen live: one wire per exit made a robot every time)",
        prev: Array.from({ length: 8 }, (_, i) => line([70 + i * 70, 200], [65 + i * 72, 300])),
        panelIndex: 1,
    },
    {
        name: "Nothing in the strip (previous player stopped short)",
        expectation: "a middle panel with no exits: draw something anyway and leave exits",
        prev: [line([300, 50], [350, 200])],
        panelIndex: 1,
    },
    {
        name: "Bottom panel: two legs entering",
        expectation: "feet, wheels or roots and some ground, nothing needs to reach the bottom",
        prev: [line([250, 100], [240, 300]), line([420, 100], [430, 300])],
        panelIndex: 2,
    },
];

// The panel as players will see it (the same renderer the model is shown),
// with the anchors we told the model about drawn on top
function panelSvg(hint: Point[][], strokes: Point[][]): string {
    const exits = findAnchors(hint, BAND_BOTTOM)
        .map(
            (a) =>
                `<circle cx="${a.x.toFixed(1)}" cy="${a.y.toFixed(1)}" r="4" fill="${a.kind === "exit" ? "#b91c1c" : "#d97706"}" />`,
        )
        .join("");
    const png = renderPanelPng(hint, strokes).toString("base64");
    return `<svg viewBox="0 0 ${PANEL_WIDTH} ${PANEL_HEIGHT}" width="${PANEL_WIDTH}" height="${PANEL_HEIGHT}" style="border:1px solid #ccc">
    <image href="data:image/png;base64,${png}" width="${PANEL_WIDTH}" height="${PANEL_HEIGHT}" />
    ${exits}
  </svg>`;
}

async function main() {
    if (!process.env.OPENAI_API_KEY && process.env.DRAWING_BOT_FAKE !== "1") {
        console.error("OPENAI_API_KEY is not set. Ensure server/.env contains it, then re-run.");
        process.exit(1);
    }

    const sections: string[] = [];
    let allPass = true;
    // ONLY=fringe runs the scenarios whose name contains that text
    const only = process.env.ONLY?.toLowerCase();
    for (const scenario of scenarios) {
        if (only && !scenario.name.toLowerCase().includes(only)) continue;
        console.log(`\n▶ ${scenario.name}`);
        console.log(`  expectation: ${scenario.expectation}`);
        const hint = extractHintEnd(scenario.prev);
        const isLast = scenario.panelIndex === 2;
        try {
            const { strokes, description, guess, draft } = await completePanel(hint, {
                panelIndex: scenario.panelIndex,
                nPanels: 3,
                color: AI_COLOR,
            });
            const checks = checkContribution(strokes, hint, isLast);
            allPass = allPass && checks.every((c) => c.pass);
            if (guess) console.log(`  guessed above: "${guess}"`);
            console.log(`  model said: "${description}"`);
            console.log(
                `  added ${strokes.length} stroke(s), ${strokes.flat().length} point(s)${draft ? ` (revised from ${draft.length} after seeing the render)` : ""}`,
            );
            for (const c of checks) console.log(`  ${c.pass ? "✔" : "✖"} ${c.name}: ${c.detail}`);
            sections.push(`<section>
  <h2>${scenario.name}</h2>
  <p class="exp">Expectation: ${scenario.expectation}</p>
  <p class="said">${guess ? `Guessed above: &ldquo;${guess}&rdquo;. ` : ""}Model: &ldquo;${description}&rdquo;</p>
  ${draft ? `<div class="pair"><figure><figcaption>blind draft</figcaption>${panelSvg(hint, draft)}</figure><figure><figcaption>after seeing the render</figcaption>${panelSvg(hint, strokes)}</figure></div>` : panelSvg(hint, strokes)}
  <ul>${checks.map((c) => `<li class="${c.pass ? "pass" : "fail"}">${c.name}: ${c.detail}</li>`).join("")}</ul>
</section>`);
        } catch (err) {
            allPass = false;
            console.error(`  FAILED: ${(err as Error).message}`);
            sections.push(
                `<section><h2>${scenario.name}</h2><p class="fail">FAILED: ${(err as Error).message}</p></section>`,
            );
        }
    }

    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Drawing bot validation</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem; color: #222; }
  h1 { font-size: 1.3rem; }
  section { margin: 2rem 0; padding-bottom: 1rem; border-bottom: 1px solid #eee; }
  .exp { color: #666; font-size: .9rem; }
  .said { font-style: italic; }
  ul { font-size: .85rem; }
  .pass { color: #15803d; }
  .fail { color: #b91c1c; }
  .pair { display: flex; gap: 1rem; flex-wrap: wrap; }
  figure { margin: 0; }
  figcaption { font-size: .8rem; color: #666; margin-bottom: .25rem; }
</style></head>
<body>
  <h1>Drawing bot validation</h1>
  <p>Grey = the strip carried over from the previous player (the tinted band is all the bot sees). Red dots = the exits we told the model about, orange = loose ends. Blue = what the bot drew, rendered as players will see it.</p>
  <p class="${allPass ? "pass" : "fail"}">${allPass ? "ALL INVARIANTS PASS" : "INVARIANT FAILURE"}</p>
  ${sections.join("\n  ")}
</body></html>`;

    const outPath = resolve(process.cwd(), "drawing-bot-validation.html");
    writeFileSync(outPath, html);
    console.log(`\n${allPass ? "✔ ALL INVARIANTS PASS" : "✖ INVARIANT FAILURE"}`);
    console.log(`Wrote ${outPath}`);
    process.exit(allPass ? 0 : 1);
}

main();
