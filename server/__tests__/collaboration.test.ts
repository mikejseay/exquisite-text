import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

import { Drawing, Poem } from "../modules/collaboration";
import { createMockIO } from "./helpers";
import type { Point } from "../../src/types";

describe("Poem", () => {
    let io: ReturnType<typeof createMockIO>;
    let poem: InstanceType<typeof Poem>;

    beforeEach(() => {
        io = createMockIO();
        poem = new Poem(io, "ROOM1", 5, 0);
    });

    it("initializes with correct defaults", () => {
        assert.equal(poem.halfLine, "");
        assert.equal(poem.lines.size, 0);
        assert.equal(poem.analysis, "");
        assert.equal(poem.nContributions, 5);
        assert.equal(poem.indexInGame, 0);
        assert.equal(poem.roomID, "ROOM1");
        assert.equal(poem.mostRecentEditor, "");
        assert.ok(poem.ID); // UUID should be set
    });

    it("submitLine adds a line and updates halfLine", async () => {
        await poem.submitLine("author-1", "The sun rises", "over the hills");

        assert.equal(poem.lines.size, 1);
        assert.equal(poem.halfLine, "over the hills");
        assert.equal(poem.mostRecentEditor, "author-1");

        const line = Array.from(poem.lines)[0];
        assert.equal(line.content, "The sun rises");
        assert.equal(line.authorDevice, "author-1");
        assert.equal(line.passerDevice, ""); // first submit has no previous editor
        assert.equal(line.editLength, 0); // halfLine was empty
        assert.equal(line.contributionIndex, 0);
    });

    it("submitLine tracks contribution index correctly across multiple submissions", async () => {
        await poem.submitLine("author-1", "Line one", "half of line two");
        await poem.submitLine("author-2", "Rest of line two", "half of line three");

        assert.equal(poem.lines.size, 2);
        const lines = Array.from(poem.lines);
        assert.equal(lines[0].contributionIndex, 0);
        assert.equal(lines[1].contributionIndex, 1);
        assert.equal(lines[1].passerDevice, "author-1");
        assert.equal(lines[1].editLength, "half of line two".length);
    });

    it("submitLine emits to spectators", async () => {
        await poem.submitLine("author-1", "hello world", "second part");

        const emission = io.emissions.find(
            (e: any) => e.target === "ROOM1_Spectators" && e.event === "stcLineSpectator",
        );
        assert.ok(emission);
        assert.deepEqual(emission!.args, [ 0, "hello world" ]);
    });

    it("sendLineEditToSpectators emits correct event", () => {
        poem.sendLineEditToSpectators("typing...");

        const emission = io.emissions.find(
            (e: any) => e.event === "stcLineEditSpectator",
        );
        assert.ok(emission);
        assert.deepEqual(emission!.args, [ 0, "typing..." ]);
    });

    it("sendLine emits to a specific socket", () => {
        poem.sendLine("hello", "socket-99");

        const emission = io.emissions.find(
            (e: any) => e.target === "socket-99" && e.event === "stcLineSpectator",
        );
        assert.ok(emission);
        assert.deepEqual(emission!.args, [ 0, "hello" ]);
    });

    it("sendAllLinesTo sends all existing lines to a socket", async () => {
        await poem.submitLine("a1", "Line A", "half");
        await poem.submitLine("a2", "Line B", "half2");

        io.emissions.length = 0; // clear previous emissions
        poem.sendAllLinesTo("new-spectator");

        const lineEmissions = io.emissions.filter(
            (e: any) => e.target === "new-spectator" && e.event === "stcLineSpectator",
        );
        assert.equal(lineEmissions.length, 2);
    });
});

describe("Drawing", () => {
    let io: ReturnType<typeof createMockIO>;
    let drawing: InstanceType<typeof Drawing>;

    beforeEach(() => {
        io = createMockIO();
        drawing = new Drawing(io, "ROOM1", 3, 0);
    });

    it("initializes with correct defaults", () => {
        assert.deepEqual(drawing.panelHint, []);
        assert.equal(drawing.panels.size, 0);
        assert.equal(drawing.nContributions, 3);
    });

    it("submitPanel adds a panel and resets hint", () => {
        const content: Point[][] = [ [ { x: 10, y: 20, lineWidth: 2, color: "#ff0000" } ] ];
        drawing.panelHint = [ [ { x: 1, y: 1, lineWidth: 1, color: "#000" } ] ];

        drawing.submitPanel("author-1", content);

        assert.equal(drawing.panels.size, 1);
        assert.deepEqual(drawing.panelHint, []); // reset
        assert.equal(drawing.mostRecentEditor, "author-1");

        const panel = Array.from(drawing.panels)[0];
        assert.equal(panel.authorDevice, "author-1");
        assert.equal(panel.contributionIndex, 0);
        assert.deepEqual(panel.content, content);
    });

    it("submitPanel emits to spectators", () => {
        const content: Point[][] = [ [ { x: 0, y: 0, lineWidth: 1, color: "#000" } ] ];
        drawing.submitPanel("author-1", content);

        const emission = io.emissions.find(
            (e: any) => e.event === "stcPanelSpectator",
        );
        assert.ok(emission);
        assert.deepEqual(emission!.args, [ 0, content ]);
    });

    it("sendPanelEditToSpectators emits correct event", () => {
        const content: Point[][] = [ [ { x: 5, y: 5, lineWidth: 3, color: "#00f" } ] ];
        drawing.sendPanelEditToSpectators(content);

        const emission = io.emissions.find(
            (e: any) => e.event === "stcPanelEditSpectator",
        );
        assert.ok(emission);
        assert.deepEqual(emission!.args, [ 0, content ]);
    });

    it("sendAllPanelsTo sends all panels to a socket", () => {
        const c1: Point[][] = [ [ { x: 0, y: 0, lineWidth: 1, color: "#000" } ] ];
        const c2: Point[][] = [ [ { x: 1, y: 1, lineWidth: 2, color: "#fff" } ] ];
        drawing.submitPanel("a1", c1);
        drawing.submitPanel("a2", c2);

        io.emissions.length = 0;
        drawing.sendAllPanelsTo("new-spectator");

        const panelEmissions = io.emissions.filter(
            (e: any) => e.target === "new-spectator" && e.event === "stcPanelSpectator",
        );
        assert.equal(panelEmissions.length, 2);
    });
});
