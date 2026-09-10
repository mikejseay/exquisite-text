import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { completePanel, extractHintEnd, OVERLAP, PANEL_HEIGHT, PANEL_WIDTH } from "modules/drawing_bot";
import { type Check, checkContribution, strokesToSvg } from "scripts/drawingChecks";
import type { Point } from "shared/types/types";

// Self-play harness: the drawing bot plays a full exquisite-corpse game
// against itself, and we ASSERT the game's invariants on the live model
// output, not just the pure helpers. This is the end-to-end confirmation that
// the relay rules hold even with a real LLM in the loop, and the place to
// eyeball whether the bot is actually a good drawing partner.
//
// The invariants asserted on each contribution live in scripts/drawingChecks.ts.
//
// Run from the server directory:
//   yarn selfplay:drawing            (one game, bot draws all panels)
//   GAMES=4 yarn selfplay:drawing    (several games side by side)
//   SEED=1 yarn selfplay:drawing     (fixed first panel instead of a bot one)
//   DRAWING_BOT_FAKE=1 yarn selfplay:drawing   (no network, canned bot)
// then open the printed HTML to view the composites.

const N_PANELS = 3; // matches DrawingRoom's nContributions
const N_GAMES = Math.max(1, Number(process.env.GAMES) || 1);
const USE_SEED = process.env.SEED === "1";
const PALETTE = ["#1d4ed8", "#b91c1c", "#15803d", "#a21caf"];

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

type Game = { panels: Point[][][]; results: Array<{ panel: number; checks: Check[]; description: string }> };

async function playGame(gameIndex: number): Promise<Game> {
    const panels: Point[][][] = USE_SEED ? [seedPanel()] : [];
    const results: Game["results"] = [];
    console.log(`\n=== Game ${gameIndex + 1}: exquisite-corpse drawing (${N_PANELS} panels) ===`);
    if (USE_SEED) console.log("Panel 0: seed shape (fixed)\n");

    for (let i = panels.length; i < N_PANELS; i++) {
        const prev = panels[i - 1];
        const hint = prev ? extractHintEnd(prev) : []; // EXACTLY what a player is shown
        const isLast = i === N_PANELS - 1;
        const { strokes, description } = await completePanel(hint, {
            canvasWidth: PANEL_WIDTH,
            canvasHeight: PANEL_HEIGHT,
            overlap: OVERLAP,
            panelIndex: i,
            nPanels: N_PANELS,
            color: PALETTE[i % PALETTE.length],
        });
        const checks = checkContribution(strokes, hint, isLast);
        results.push({ panel: i, checks, description });
        panels.push(strokes);

        console.log(`Panel ${i}: "${description}"`);
        console.log(`  shown hint: ${hint.length} stroke(s) from the carried edge`);
        console.log(`  drew: ${strokes.length} stroke(s), ${strokes.flat().length} pts`);
        for (const c of checks) console.log(`  ${c.pass ? "✔" : "✖"} ${c.name}: ${c.detail}`);
        console.log("");
    }
    return { panels, results };
}

function renderGame(game: Game, index: number): string {
    const step = PANEL_HEIGHT * (1 - OVERLAP);
    const totalH = step * (N_PANELS - 1) + PANEL_HEIGHT;
    const composite = game.panels.map((p, i) => strokesToSvg(p, i * step)).join("\n    ");
    const captions = game.results.map((r) => `<li>Panel ${r.panel}: ${r.description}</li>`).join("");
    const failures = game.results.flatMap((r) =>
        r.checks.filter((c) => !c.pass).map((c) => `panel ${r.panel}: ${c.name}`),
    );
    return `<figure class="game">
  <figcaption><strong>Game ${index + 1}</strong> ${failures.length === 0 ? '<span class="pass">all invariants pass</span>' : `<span class="fail">${failures.join("; ")}</span>`}<ul>${captions}</ul></figcaption>
  <svg viewBox="0 0 ${PANEL_WIDTH} ${totalH}" width="400" height="${(400 / PANEL_WIDTH) * totalH}" style="background:#fff;border:1px solid #999">
    ${composite}
  </svg></figure>`;
}

async function main() {
    if (!process.env.OPENAI_API_KEY && process.env.DRAWING_BOT_FAKE !== "1") {
        console.error("OPENAI_API_KEY is not set. Ensure server/.env has it, then re-run.");
        process.exit(1);
    }

    const games: Game[] = [];
    for (let g = 0; g < N_GAMES; g++) games.push(await playGame(g));

    const allPass = games.every((game) => game.results.every((r) => r.checks.every((c) => c.pass)));
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Self-play drawing</title>
<style>body{font-family:system-ui,sans-serif;margin:2rem;color:#222}figure{margin:0 0 1rem}figcaption{font-size:.8rem;color:#666;max-width:400px}figcaption ul{margin:.3rem 0 .5rem;padding-left:1.2rem}.row{display:flex;gap:1.5rem;flex-wrap:wrap}.verdict{font-weight:bold;font-size:1.1rem}.pass{color:#15803d}.fail{color:#b91c1c}</style>
</head><body>
<h1>Self-play exquisite-corpse drawing</h1>
<p class="verdict ${allPass ? "pass" : "fail"}">${allPass ? "ALL INVARIANTS PASS" : "INVARIANT FAILURE"}</p>
<p>Each column is one game: the bot drew every panel, seeing only the strip carried over from the previous one. Colours mark the panels.</p>
<div class="row">${games.map(renderGame).join("\n")}</div>
</body></html>`;

    const outPath = resolve(process.cwd(), "self-play-drawing.html");
    writeFileSync(outPath, html);

    console.log(`${allPass ? "✔ ALL INVARIANTS PASS" : "✖ INVARIANT FAILURE"}`);
    console.log(`Wrote ${outPath}`);
    process.exit(allPass ? 0 : 1);
}

main();
