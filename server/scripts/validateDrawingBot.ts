import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { completePanel } from "modules/drawing_bot";
import type { Point } from "shared/types/types";

// Validation harness for the vector drawing bot.
//
// The open question: can a text LLM collaborate on a drawing from raw
// coordinates alone, without ever rasterizing the canvas? This script
// feeds the model a few recognizable partial drawings, asks it to
// continue each, and renders the result to an HTML file so a human can
// judge whether the continuation actually relates to the input.
//
// Run from the server directory:
//   node --env-file-if-exists=.env --import tsx -r tsconfig-paths/register scripts/validateDrawingBot.ts
// (or: yarn validate:drawing) then open the printed HTML path in a browser.

const CANVAS = 500;
const HINT_COLOR = "#999999";
const AI_COLOR = "#1d4ed8";

function circle(cx: number, cy: number, r: number, n = 24): Point[] {
    return Array.from({ length: n + 1 }, (_, i) => {
        const a = (i / n) * 2 * Math.PI;
        return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), lineWidth: 3, color: HINT_COLOR };
    });
}

function polyline(coords: Array<[number, number]>): Point[] {
    return coords.map(([x, y]) => ({ x, y, lineWidth: 3, color: HINT_COLOR }));
}

const scenarios: Array<{ name: string; expectation: string; hint: Point[][] }> = [
    {
        name: "A lone circle (a head?)",
        expectation: "should add a face, body, hat, or limbs",
        hint: [circle(250, 150, 60)],
    },
    {
        name: "A house with no roof",
        expectation: "should add a roof, door, or windows",
        hint: [
            polyline([
                [180, 440],
                [180, 300],
                [320, 300],
                [320, 440],
                [180, 440],
            ]),
        ],
    },
    {
        name: "A single horizon line",
        expectation: "open-ended: sun, tree, figure — anything sitting on the horizon",
        hint: [
            polyline([
                [40, 300],
                [140, 280],
                [250, 310],
                [360, 285],
                [460, 305],
            ]),
        ],
    },
];

function strokesToSvg(strokes: Point[][]): string {
    return strokes
        .map((stroke) => {
            const pts = stroke.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
            const color = stroke[0]?.color ?? "#000";
            const width = stroke[0]?.lineWidth ?? 3;
            return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" />`;
        })
        .join("\n      ");
}

function svgBlock(title: string, strokes: Point[][]): string {
    return `<figure>
    <figcaption>${title}</figcaption>
    <svg viewBox="0 0 ${CANVAS} ${CANVAS}" width="320" height="320" style="background:#fff;border:1px solid #ddd">
      ${strokesToSvg(strokes)}
    </svg>
  </figure>`;
}

async function main() {
    if (!process.env.OPENAI_API_KEY) {
        console.error(
            "OPENAI_API_KEY is not set. Ensure server/.env contains it (the run command loads .env), then re-run.",
        );
        process.exit(1);
    }

    const sections: string[] = [];
    for (const scenario of scenarios) {
        console.log(`\n▶ ${scenario.name}`);
        console.log(`  expectation: ${scenario.expectation}`);
        try {
            const { strokes, description } = await completePanel(scenario.hint, {
                canvasWidth: CANVAS,
                canvasHeight: CANVAS,
                maxStrokes: 4,
                color: AI_COLOR,
            });
            console.log(`  model said: "${description}"`);
            console.log(`  added ${strokes.length} stroke(s), ${strokes.flat().length} point(s)`);

            const overlay = [...scenario.hint, ...strokes];
            sections.push(`<section>
  <h2>${scenario.name}</h2>
  <p class="exp">Expectation: ${scenario.expectation}</p>
  <p class="said">Model: &ldquo;${description}&rdquo;</p>
  <div class="row">
    ${svgBlock("Input (previous player, grey)", scenario.hint)}
    ${svgBlock("Input + AI continuation (blue)", overlay)}
  </div>
</section>`);
        } catch (err) {
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
  .row { display: flex; gap: 2rem; flex-wrap: wrap; }
  figure { margin: 0; }
  figcaption { font-size: .8rem; color: #666; margin-bottom: .3rem; }
  .exp { color: #666; font-size: .9rem; }
  .said { font-style: italic; }
  .fail { color: #b00; }
</style></head>
<body>
  <h1>Vector drawing bot &mdash; collaboration validation</h1>
  <p>Grey = strokes passed in. Blue = what the model added from coordinates alone (no rasterization).</p>
  ${sections.join("\n  ")}
</body></html>`;

    const outPath = resolve(process.cwd(), "drawing-bot-validation.html");
    writeFileSync(outPath, html);
    console.log(`\n✔ Wrote ${outPath}`);
    console.log("  Open it in a browser to judge whether the continuations actually collaborate.");
}

main();
