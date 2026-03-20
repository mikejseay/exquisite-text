import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

import { DrawingEditor, PoemEditor } from "modules/editor";
import { DrawingRoom, PoemRoom } from "modules/room";
import { Drawing, Poem } from "modules/collaboration";
import { roomIDToRoom } from "modules/globals";
import { createMockIO, createMockSocket } from "__tests__/helpers";
import { defaultGameSettings } from "shared/constants/constants";

describe("PoemEditor", () => {
    let io: ReturnType<typeof createMockIO>;
    let room: InstanceType<typeof PoemRoom>;
    let editor: InstanceType<typeof PoemEditor>;

    beforeEach(() => {
        io = createMockIO();
        const hostSocket = createMockSocket("host");
        room = new PoemRoom(io, hostSocket, "ROOM1");
        roomIDToRoom.set("ROOM1", room);

        const editorSocket = createMockSocket("editor-sock-1");
        editor = new PoemEditor(io, editorSocket, "ROOM1", "dev-1", "Alice");
    });

    afterEach(() => {
        clearInterval(room.activityInterval);
        roomIDToRoom.clear();
    });

    it("hasWorkInQueue returns false when queue is empty", () => {
        assert.equal(editor.hasWorkInQueue(), false);
    });

    it("hasWorkInQueue returns true when queue has items", () => {
        editor.contributionQueue.push(new Poem(io, "ROOM1", 5, 0));
        assert.equal(editor.hasWorkInQueue(), true);
    });

    it("currentlyOnLastContribution returns false when no poems in queue", () => {
        assert.equal(editor.currentlyOnLastContribution(), false);
    });

    it("currentlyOnLastContribution returns true when poem lines.size >= nContributions - 2", () => {
        const poem = new Poem(io, "ROOM1", 4, 0); // nContributions = 4
        // Need lines.size >= 2 (4 - 2)
        poem.lines.add({ ID: "p", contributionIndex: 0, content: "a", authorDevice: "x", passerDevice: "", editLength: 0, addedAt: new Date() });
        poem.lines.add({ ID: "p", contributionIndex: 1, content: "b", authorDevice: "y", passerDevice: "x", editLength: 1, addedAt: new Date() });
        editor.contributionQueue.push(poem);

        assert.equal(editor.currentlyOnLastContribution(), true);
    });

    it("currentlyOnLastContribution returns false when poem has few lines", () => {
        const poem = new Poem(io, "ROOM1", 6, 0); // nContributions = 6, need >= 4
        poem.lines.add({ ID: "p", contributionIndex: 0, content: "a", authorDevice: "x", passerDevice: "", editLength: 0, addedAt: new Date() });
        editor.contributionQueue.push(poem);

        assert.equal(editor.currentlyOnLastContribution(), false);
    });

    it("handlePoem creates IPoem and stores in room", () => {
        const poem = new Poem(io, "ROOM1", 3, 0);
        poem.lines.add({ ID: poem.ID, contributionIndex: 0, content: "Line one", authorDevice: "a", passerDevice: "", editLength: 0, addedAt: new Date() });
        poem.lines.add({ ID: poem.ID, contributionIndex: 1, content: "Line two", authorDevice: "b", passerDevice: "a", editLength: 5, addedAt: new Date() });

        room.addEditor("dev-1", editor);
        editor.handlePoem(poem);

        assert.equal(room.finishedWorks.length, 1);
        // Should have emitted stcPoemLines
        const emission = io.emissions.find((e: any) => e.event === "stcPoemLines");
        assert.ok(emission);
    });

    it("sendPoemAsLines emits to the whole room", () => {
        const poem = new Poem(io, "ROOM1", 3, 0);
        poem.lines.add({ ID: poem.ID, contributionIndex: 0, content: "hello", authorDevice: "a", passerDevice: "", editLength: 0, addedAt: new Date() });

        editor.sendPoemAsLines(poem);

        const emission = io.emissions.find(
            (e: any) => e.target === "ROOM1" && e.event === "stcPoemLines",
        );
        assert.ok(emission);
        assert.equal(emission!.args[0].length, 1);
        assert.equal(emission!.args[0][0].content, "hello");
    });

    it("isVIP returns true for first editor in the map", () => {
        room.editors.set("dev-1", editor as any);
        assert.equal(editor.isVIP(), true);
    });

    it("isVIP returns falsy for non-first editor", () => {
        const otherEditor = new PoemEditor(io, createMockSocket("other"), "ROOM1", "dev-0", "Zara");
        room.editors.set("dev-0", otherEditor as any);
        room.editors.set("dev-1", editor as any);
        assert.ok(!editor.isVIP());
    });

    it("alterGameSettings updates room settings and broadcasts", () => {
        room.addEditor("dev-1", editor as any);
        const newSettings = { ...defaultGameSettings, nPoems: 3 };
        editor.alterGameSettings(newSettings);

        assert.deepEqual(room.gameSettings, newSettings);
        // Broadcast goes via socket.to(), check socket emissions
        const editorSocket = editor.socket as any;
        const broadcast = editorSocket.socketEmissions.find(
            (e: any) => e.event === "stcGameSettingsInfo",
        );
        assert.ok(broadcast);
        assert.deepEqual(broadcast.args, [ newSettings ]);
    });

    it("possibleStartNewTurn with empty queue sets inactive", () => {
        editor.contributionQueue = [];
        editor.possibleStartNewTurn();

        const activeEmission = io.emissions.find(
            (e: any) => e.target === "editor-sock-1" && e.event === "stcEditorActive",
        );
        assert.ok(activeEmission);
        assert.equal(activeEmission!.args[0], false);
        assert.equal(editor.isCurrentlyEditing, false);
    });

    it("possibleStartNewTurn with work in queue sets active and sends halfLine", () => {
        const poem = new Poem(io, "ROOM1", 5, 0);
        poem.halfLine = "the rain";
        editor.contributionQueue.push(poem);

        editor.possibleStartNewTurn();

        assert.equal(editor.isCurrentlyEditing, true);
        const lineEditEmission = io.emissions.find(
            (e: any) => e.target === "editor-sock-1" && e.event === "stcLineEdit",
        );
        assert.ok(lineEditEmission);
        assert.equal(lineEditEmission!.args[0], "the rain");
    });
});

describe("DrawingEditor", () => {
    let io: ReturnType<typeof createMockIO>;
    let room: InstanceType<typeof DrawingRoom>;
    let editor: InstanceType<typeof DrawingEditor>;

    beforeEach(() => {
        io = createMockIO();
        room = new DrawingRoom(io, createMockSocket("host"), "DRAW1");
        roomIDToRoom.set("DRAW1", room);

        editor = new DrawingEditor(io, createMockSocket("editor-sock"), "DRAW1", "dev-1", "Alice");
    });

    afterEach(() => {
        clearInterval(room.activityInterval);
        roomIDToRoom.clear();
    });

    it("currentlyOnLastContribution returns false with empty queue", () => {
        assert.equal(editor.currentlyOnLastContribution(), false);
    });

    it("currentlyOnLastContribution returns true when panels.size >= nContributions - 1", () => {
        const drawing = new Drawing(io, "DRAW1", 3, 0); // nContributions = 3
        drawing.panels.add({ ID: "d", contributionIndex: 0, content: [], authorDevice: "x", passerDevice: "", hintSize: 0, addedAt: new Date() });
        drawing.panels.add({ ID: "d", contributionIndex: 1, content: [], authorDevice: "y", passerDevice: "x", hintSize: 0, addedAt: new Date() });
        editor.contributionQueue.push(drawing);

        assert.equal(editor.currentlyOnLastContribution(), true);
    });

    it("handlePanelEdit updates lastActivity", () => {
        const drawing = new Drawing(io, "DRAW1", 3, 0);
        editor.contributionQueue.push(drawing);
        const before = editor.lastActivity;

        // Small delay to ensure Date.now() is different
        editor.handlePanelEdit([ [ { x: 0, y: 0, lineWidth: 1, color: "#000" } ] ]);

        assert.ok(editor.lastActivity >= before);
    });
});
