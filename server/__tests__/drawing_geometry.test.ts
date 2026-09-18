import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    applyEraser,
    expandShape,
    findAnchors,
    parseShape,
    pointToSegmentDistance,
    snapToAnchors,
    wobble,
    type XY,
} from "modules/drawing_geometry";
import type { Point } from "shared/types/types";

function pt(x: number, y: number, color = "#7F7F7F", lineWidth = 3): Point {
    return { x, y, lineWidth, color };
}
function stroke(...xy: Array<[number, number]>): Point[] {
    return xy.map(([x, y]) => pt(x, y));
}
function gaps(points: XY[]): number[] {
    return points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
}

describe("parseShape: tolerant reading of the model's shapes", () => {
    it("reads every shape type, case-insensitively", () => {
        assert.deepEqual(parseShape({ type: "Line", x1: 1, y1: 2, x2: 3, y2: 4 }), {
            type: "line",
            x1: 1,
            y1: 2,
            x2: 3,
            y2: 4,
        });
        assert.deepEqual(
            parseShape({
                type: " polyline ",
                points: [
                    [1, 2],
                    [3, 4],
                ],
            }),
            {
                type: "polyline",
                points: [
                    { x: 1, y: 2 },
                    { x: 3, y: 4 },
                ],
            },
        );
        assert.deepEqual(
            parseShape({
                type: "curve",
                points: [
                    { x: 1, y: 2 },
                    { x: 3, y: 4 },
                ],
            }),
            {
                type: "curve",
                points: [
                    { x: 1, y: 2 },
                    { x: 3, y: 4 },
                ],
            },
        );
        assert.deepEqual(parseShape({ type: "ellipse", cx: 1, cy: 2, rx: 3, ry: 4, rotation: 10 }), {
            type: "ellipse",
            cx: 1,
            cy: 2,
            rx: 3,
            ry: 4,
            rotation: 10,
        });
    });

    it("maps a circle onto an ellipse", () => {
        assert.deepEqual(parseShape({ type: "circle", cx: 5, cy: 6, r: 7 }), {
            type: "ellipse",
            cx: 5,
            cy: 6,
            rx: 7,
            ry: 7,
        });
    });

    it("coerces numeric strings and rejects junk", () => {
        assert.deepEqual(parseShape({ type: "line", x1: "1", y1: "2", x2: "3", y2: "4" }), {
            type: "line",
            x1: 1,
            y1: 2,
            x2: 3,
            y2: 4,
        });
        assert.equal(parseShape({ type: "line", x1: "a", y1: 2, x2: 3, y2: 4 }), null);
        assert.equal(parseShape({ type: "circle", cx: 1, cy: 1, r: 0 }), null);
        assert.equal(parseShape({ type: "ellipse", cx: 1, cy: 1, rx: -3, ry: 3 }), null);
        assert.equal(parseShape({ type: "blob" }), null);
        assert.equal(parseShape(null), null);
        assert.equal(parseShape("line"), null);
    });

    it("accepts the shapes a model reaches for anyway: rect, polygon, flat point lists, x/y circles", () => {
        assert.deepEqual(parseShape({ type: "rect", x: 10, y: 20, width: 30, height: 40 }), {
            type: "polyline",
            points: [
                { x: 10, y: 20 },
                { x: 40, y: 20 },
                { x: 40, y: 60 },
                { x: 10, y: 60 },
                { x: 10, y: 20 },
            ],
        });
        assert.equal(parseShape({ type: "rectangle", x: 10, y: 20, w: 0, h: 40 }), null);
        // corner form, seen live: {"type":"rectangle","x1":305,"y1":120,"x2":395,"y2":210}
        assert.deepEqual(
            parseShape({ type: "rectangle", x1: 10, y1: 20, x2: 40, y2: 60 }),
            parseShape({ type: "rect", x: 10, y: 20, width: 30, height: 40 }),
        );
        assert.equal(parseShape({ type: "rectangle", x1: 40, y1: 20, x2: 10, y2: 60 }), null);
        assert.deepEqual(
            parseShape({
                type: "polygon",
                points: [
                    [0, 0],
                    [10, 0],
                    [5, 8],
                ],
            }),
            {
                type: "polyline",
                points: [
                    { x: 0, y: 0 },
                    { x: 10, y: 0 },
                    { x: 5, y: 8 },
                    { x: 0, y: 0 },
                ],
            },
        );
        assert.deepEqual(parseShape({ type: "polyline", points: [1, 2, 3, 4, 5, 6] }), {
            type: "polyline",
            points: [
                { x: 1, y: 2 },
                { x: 3, y: 4 },
                { x: 5, y: 6 },
            ],
        });
        assert.deepEqual(parseShape({ type: "circle", x: 5, y: 6, r: 7 }), {
            type: "ellipse",
            cx: 5,
            cy: 6,
            rx: 7,
            ry: 7,
        });
    });

    it("drops bad points inside a points array but keeps the shape if 2 remain", () => {
        const shape = parseShape({ type: "polyline", points: [[1, 2], "x", [null, 3], [5, 6]] });
        assert.deepEqual(shape, {
            type: "polyline",
            points: [
                { x: 1, y: 2 },
                { x: 5, y: 6 },
            ],
        });
        assert.equal(parseShape({ type: "curve", points: [[1, 2], "x"] }), null);
    });
});

describe("expandShape: shapes become evenly spaced points", () => {
    it("samples lines and polylines at about the step, keeping the corners", () => {
        const line = expandShape({ type: "line", x1: 0, y1: 0, x2: 100, y2: 0 }, 4);
        assert.deepEqual(line[0], { x: 0, y: 0 });
        assert.deepEqual(line[line.length - 1], { x: 100, y: 0 });
        for (const g of gaps(line)) assert.ok(g <= 6 && g >= 1, `gap ${g}`);

        const poly = expandShape(
            {
                type: "polyline",
                points: [
                    { x: 0, y: 0 },
                    { x: 0, y: 40 },
                    { x: 30, y: 40 },
                ],
            },
            4,
        );
        assert.ok(
            poly.some((p) => p.x === 0 && p.y === 40),
            "the corner is kept",
        );
        for (const g of gaps(poly)) assert.ok(g <= 6 && g >= 1, `gap ${g}`);
    });

    it("curves pass through their control points", () => {
        const controls = [
            { x: 0, y: 0 },
            { x: 50, y: 80 },
            { x: 100, y: 0 },
            { x: 150, y: 60 },
        ];
        const curve = expandShape({ type: "curve", points: controls }, 3);
        for (const c of controls) {
            const d = Math.min(...curve.map((p) => Math.hypot(p.x - c.x, p.y - c.y)));
            assert.ok(d <= 0.5, `curve misses control point (${c.x},${c.y}) by ${d}`);
        }
        assert.deepEqual(curve[0], controls[0]);
        assert.deepEqual(curve[curve.length - 1], controls[controls.length - 1]);
        for (const g of gaps(curve)) assert.ok(g <= 8, `gap ${g}`);
    });

    it("a two-point curve is a straight line", () => {
        const curve = expandShape(
            {
                type: "curve",
                points: [
                    { x: 0, y: 0 },
                    { x: 0, y: 20 },
                ],
            },
            4,
        );
        for (const p of curve) assert.equal(p.x, 0);
    });

    it("ellipses close and lie on the ellipse, rotation moves the start point", () => {
        const e = expandShape({ type: "ellipse", cx: 100, cy: 50, rx: 40, ry: 20 }, 4);
        assert.ok(e.length >= 12);
        assert.deepEqual(e[0], e[e.length - 1]);
        for (const p of e) {
            const v = ((p.x - 100) / 40) ** 2 + ((p.y - 50) / 20) ** 2;
            assert.ok(Math.abs(v - 1) < 1e-6, `off the ellipse: ${v}`);
        }
        const rotated = expandShape({ type: "ellipse", cx: 100, cy: 50, rx: 40, ry: 20, rotation: 90 }, 4);
        assert.ok(Math.abs(rotated[0].x - 100) < 1e-6 && Math.abs(rotated[0].y - 90) < 1e-6);
    });
});

describe("findAnchors: where the carried-over lines want continuing", () => {
    it("interpolates the exit where a stroke crosses the band's bottom edge", () => {
        const [a] = findAnchors([stroke([100, 40], [110, 80])], 60);
        assert.deepEqual(a, { x: 105, y: 60, heading: "down", kind: "exit" });
        const [b] = findAnchors([stroke([100, 40], [160, 80])], 60);
        assert.equal(b.heading, "down-right");
        assert.equal(Math.round(b.x), 130);
        const [c] = findAnchors([stroke([100, 40], [40, 80])], 60);
        assert.equal(c.heading, "down-left");
    });

    it("a stroke that stops within a few px of the edge is an exit on the edge", () => {
        const [a] = findAnchors([stroke([300, 10], [296, 40], [292, 57])], 60);
        assert.deepEqual(a, { x: 292, y: 60, heading: "down", kind: "exit" });
        const [b] = findAnchors([stroke([300, 10], [296, 40], [292, 50])], 60);
        assert.equal(b.kind, "end");
    });

    it("a stroke drawn upward through the edge still exits with a downward heading", () => {
        const [a] = findAnchors([stroke([200, 80], [200, 40])], 60);
        assert.equal(a.kind, "exit");
        assert.equal(a.heading, "down");
        assert.equal(a.y, 60);
    });

    it("a closed head whose chin dips into the band anchors at the chin, heading down", () => {
        // a circle drawn from its top, clockwise, ending where it began
        const circle = Array.from({ length: 41 }, (_, i) => {
            const a = -Math.PI / 2 + (i / 40) * 2 * Math.PI;
            return pt(300 + 50 * Math.cos(a), -10 + 50 * Math.sin(a));
        });
        const [a] = findAnchors([circle], 60);
        assert.equal(a.kind, "end");
        assert.equal(Math.round(a.x), 300);
        assert.equal(Math.round(a.y), 40);
        assert.equal(a.heading, "down");
    });

    it("a stroke that stops inside the band is a loose end at its lowest point", () => {
        const [a] = findAnchors([stroke([100, 10], [120, 30], [140, 45])], 60);
        assert.deepEqual(a, { x: 140, y: 45, heading: "down-right", kind: "end" });
        const [b] = findAnchors([stroke([140, 45], [120, 30], [100, 10])], 60);
        assert.equal(b.x, 140);
        assert.equal(b.y, 45);
        const [c] = findAnchors([stroke([100, 40], [160, 42])], 60);
        assert.equal(c.heading, "right");
        const [d] = findAnchors([stroke([100, 50], [100, 20])], 60);
        assert.equal(d.x, 100);
        assert.equal(d.y, 50);
    });

    it("ignores eraser strokes and dots, dedupes nearby anchors, orders and caps", () => {
        const eraser: Point[] = [pt(300, 40, "!e", 20), pt(300, 80, "!e", 20)];
        const dot = [pt(10, 10)];
        const twin = [stroke([100, 40], [100, 80]), stroke([104, 40], [104, 80])]; // 4 px apart
        const looseHigh = stroke([500, 5], [510, 20]);
        const looseLow = stroke([520, 5], [530, 50]);
        const anchors = findAnchors([eraser, dot, ...twin, looseHigh, looseLow, stroke([400, 40], [400, 80])], 60);
        assert.deepEqual(
            anchors.map((a) => [a.kind, Math.round(a.x), Math.round(a.y)]),
            [
                ["exit", 100, 60],
                ["exit", 400, 60],
                ["end", 530, 50],
                ["end", 510, 20],
            ],
        );
        assert.equal(findAnchors([...twin, looseHigh, looseLow, stroke([400, 40], [400, 80])], 60, 2).length, 2);
    });
});

describe("snapToAnchors: endpoints join the carried-over lines", () => {
    const anchors = findAnchors([stroke([100, 40], [100, 80])], 60); // exit at (100, 60)

    it("snaps a near first point and a near last point independently", () => {
        const strokes: XY[][] = [
            [
                { x: 110, y: 70 },
                { x: 150, y: 200 },
            ],
            [
                { x: 300, y: 250 },
                { x: 95, y: 55 },
            ],
            [
                { x: 100, y: 100 },
                { x: 100, y: 200 },
            ],
        ];
        const out = snapToAnchors(strokes, anchors);
        assert.deepEqual(out[0][0], { x: 100, y: 60 });
        assert.deepEqual(out[0][1], { x: 150, y: 200 });
        assert.deepEqual(out[1][1], { x: 100, y: 60 });
        assert.deepEqual(out[2], strokes[2], "40 px away is too far to snap");
        assert.deepEqual(strokes[0][0], { x: 110, y: 70 }, "input is not mutated");
    });
});

describe("applyEraser: the model sees what survived the eraser", () => {
    it("removes points under the eraser, splits the stroke, and drops the eraser itself", () => {
        const mark = stroke([0, 100], [50, 100], [100, 100], [150, 100], [200, 100]);
        const eraser: Point[] = [pt(100, 80, "!e", 30), pt(100, 120, "!e", 30)];
        const out = applyEraser([mark, eraser]);
        assert.equal(out.length, 2, "split into the two surviving pieces");
        // the eraser is 30 px wide (radius 16 with tolerance), so the gap spans about x 84 to 116
        assert.ok(out[0].every((p) => p.x <= 84) && out[1].every((p) => p.x >= 116));
        assert.equal(out[0][0].x, 0);
        assert.equal(out[1][out[1].length - 1].x, 200);
        assert.ok(out.every((s) => s[0].color !== "!e"));
    });

    it("takes only a bite out of a sparse stroke, like the raster eraser does", () => {
        // two points 100 px apart; a thin eraser crossing the middle must leave both halves
        const mark = stroke([300, 200], [300, 300]);
        const eraser: Point[] = [pt(280, 250, "!e", 4), pt(320, 250, "!e", 4)];
        const out = applyEraser([mark, eraser]);
        assert.equal(out.length, 2);
        assert.ok(out[0].every((p) => p.y < 247) && out[1].every((p) => p.y > 253));
        assert.equal(out[1][out[1].length - 1].y, 300, "the stroke still reaches its original end");
    });

    it("only erases strokes drawn before it", () => {
        const eraser: Point[] = [pt(100, 80, "!e", 30), pt(100, 120, "!e", 30)];
        const later = stroke([100, 90], [100, 110]);
        const out = applyEraser([eraser, later]);
        assert.deepEqual(out, [later]);
    });
});

describe("wobble: hand-drawn feel without breaking connections", () => {
    const line = expandShape({ type: "line", x1: 0, y1: 0, x2: 200, y2: 0 }, 4);

    it("keeps endpoints fixed, is deterministic, and stays gentle", () => {
        const a = wobble(line, 0.7, 3);
        const b = wobble(line, 0.7, 3);
        assert.deepEqual(a, b);
        assert.deepEqual(a[0], line[0]);
        assert.deepEqual(a[a.length - 1], line[line.length - 1]);
        assert.ok(
            a.some((p, i) => p.y !== line[i].y),
            "interior points move",
        );
        for (let i = 0; i < a.length; i++) {
            assert.ok(Math.hypot(a[i].x - line[i].x, a[i].y - line[i].y) <= 1.4);
        }
        assert.notDeepEqual(wobble(line, 0.7, 4), a, "a different seed gives a different wobble");
    });
});

describe("pointToSegmentDistance", () => {
    it("measures to the closest point of the segment, including its ends", () => {
        assert.equal(pointToSegmentDistance({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 }), 3);
        assert.equal(pointToSegmentDistance({ x: 13, y: 4 }, { x: 0, y: 0 }, { x: 10, y: 0 }), 5);
        assert.equal(pointToSegmentDistance({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 }), 5);
    });
});
