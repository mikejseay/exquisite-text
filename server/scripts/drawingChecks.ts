import { OVERLAP, PANEL_HEIGHT, PANEL_WIDTH } from "modules/drawing_bot";
import { findAnchors, pointToSegmentDistance } from "modules/drawing_geometry";
import type { Point } from "shared/types/types";

// Shared by the live-model harnesses: the game's invariants, asserted on
// real model output, plus a tiny SVG renderer for the report pages
//   I1  The bot is only ever shown the bottom OVERLAP band of the previous
//       panel (the hint we pass in is band-confined)
//   I2  No submitted stroke re-traces the carried-over edge (no echo)
//   I3  The contribution is non-empty and stays within panel bounds
//   I4  Every panel but the last leaves marks near the bottom so the next
//       player has something to continue
//   I5  Every panel with exits starts a stroke on one of them

export const BAND_BOTTOM = Math.round(OVERLAP * PANEL_HEIGHT);
const ECHO_EPS = 4; // slightly looser than the lib's 3px, to avoid false alarms

export type Check = { name: string; pass: boolean; detail: string };

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

export function checkContribution(strokes: Point[][], hint: Point[][], isLast: boolean): Check[] {
    const checks: Check[] = [];

    const hintMaxY = Math.max(0, ...hint.flat().map((p) => p.y));
    checks.push({
        name: "I1 hint is only the edge band",
        pass: hint.length === 0 || hintMaxY <= BAND_BOTTOM + ECHO_EPS,
        detail: `hint max y=${hintMaxY.toFixed(0)} (band bottom ${BAND_BOTTOM})`,
    });

    const echoStrokes = strokes.filter((s) =>
        s.every((p) => p.y <= BAND_BOTTOM + ECHO_EPS && pointLiesOnHint(p, hint, ECHO_EPS)),
    );
    checks.push({
        name: "I2 no carried-edge echo",
        pass: echoStrokes.length === 0,
        detail: `${echoStrokes.length}/${strokes.length} strokes re-traced the carried edge`,
    });

    const flat = strokes.flat();
    const inBounds = flat.every((p) => p.x >= 0 && p.x <= PANEL_WIDTH && p.y >= 0 && p.y <= PANEL_HEIGHT);
    checks.push({
        name: "I3 non-empty and in bounds",
        pass: strokes.length > 0 && inBounds,
        detail: `${strokes.length} strokes, ${flat.length} pts, inBounds=${inBounds}`,
    });

    const maxY = Math.max(0, ...flat.map((p) => p.y));
    checks.push({
        name: "I4 leaves a bottom connection",
        pass: isLast || maxY >= PANEL_HEIGHT * (1 - OVERLAP) - ECHO_EPS,
        detail: isLast
            ? `last panel, lowest mark y=${maxY.toFixed(0)}`
            : `lowest mark y=${maxY.toFixed(0)} (needs >= ${(PANEL_HEIGHT * (1 - OVERLAP)).toFixed(0)})`,
    });

    const exits = findAnchors(hint, BAND_BOTTOM).filter((a) => a.kind === "exit");
    const ends = strokes.flatMap((s) => [s[0], s[s.length - 1]]);
    const connected = exits.filter((a) => ends.some((p) => Math.hypot(p.x - a.x, p.y - a.y) <= 1));
    checks.push({
        name: "I5 connects to the carried-over exits",
        pass: exits.length === 0 || connected.length > 0,
        detail: `${connected.length}/${exits.length} exits continued`,
    });

    return checks;
}

export function strokesToSvg(strokes: Point[][], yOffset = 0, color?: string): string {
    return strokes
        .map((s) => {
            const pts = s.map((p) => `${p.x.toFixed(1)},${(p.y + yOffset).toFixed(1)}`).join(" ");
            const stroke = color ?? s[0]?.color ?? "#000";
            const width = s[0]?.lineWidth ?? 3;
            return `<polyline points="${pts}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
        })
        .join("\n    ");
}
