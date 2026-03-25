import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { createMockIO, createMockSocket } from "__tests__/helpers";
import { Drawing, Poem } from "modules/collaboration";
import { DrawingEditor, PoemEditor } from "modules/editor";
import { deviceIDToRoomID, deviceIDToSocketID, roomIDToRoom, socketIDToDeviceID } from "modules/globals";
import { DrawingRoom, PoemRoom } from "modules/room";
import { DrawingSpectator, PoemSpectator } from "modules/spectator";
import type { Point } from "shared/types/types";

describe("PoemSpectator", () => {
    let io: ReturnType<typeof createMockIO>;
    let room: InstanceType<typeof PoemRoom>;
    let spectator: InstanceType<typeof PoemSpectator>;

    beforeEach(() => {
        io = createMockIO();
        room = new PoemRoom(io, createMockSocket("host"), "ROOM1");
        roomIDToRoom.set("ROOM1", room);
        spectator = new PoemSpectator(io, createMockSocket("spec-sock"), "ROOM1", "spec-dev", "Spectator1");
    });

    afterEach(() => {
        clearInterval(room.activityInterval);
        roomIDToRoom.clear();
        delete deviceIDToRoomID["spec-dev"];
        delete socketIDToDeviceID["spec-sock"];
        delete deviceIDToSocketID["spec-dev"];
    });

    it("sendAllPoemLines sends in-progress poem lines to spectator", () => {
        const editor = new PoemEditor(io, createMockSocket("editor-sock"), "ROOM1", "ed-dev", "Editor1");
        room.addEditor("ed-dev", editor as any);

        const poem = new Poem(io, "ROOM1", 5, 0);
        poem.lines.add({
            ID: poem.ID,
            contributionIndex: 0,
            content: "Line A",
            authorDevice: "a",
            passerDevice: "",
            editLength: 0,
            addedAt: new Date(),
        });
        poem.lines.add({
            ID: poem.ID,
            contributionIndex: 1,
            content: "Line B",
            authorDevice: "b",
            passerDevice: "a",
            editLength: 5,
            addedAt: new Date(),
        });
        editor.contributionQueue.push(poem);

        io.emissions.length = 0;
        spectator.sendAllPoemLines();

        const lineEmissions = io.emissions.filter(
            (e: any) => e.target === "spec-sock" && e.event === "stcLineSpectator",
        );
        assert.equal(lineEmissions.length, 2);
        assert.equal(lineEmissions[0].args[1], "Line A");
        assert.equal(lineEmissions[1].args[1], "Line B");
    });

    it("sendAllPoemLines sends lines from multiple poems across editors", () => {
        const editor1 = new PoemEditor(io, createMockSocket("ed-sock-1"), "ROOM1", "ed-dev-1", "Editor1");
        const editor2 = new PoemEditor(io, createMockSocket("ed-sock-2"), "ROOM1", "ed-dev-2", "Editor2");
        room.addEditor("ed-dev-1", editor1 as any);
        room.addEditor("ed-dev-2", editor2 as any);

        const poem1 = new Poem(io, "ROOM1", 5, 0);
        poem1.lines.add({
            ID: poem1.ID,
            contributionIndex: 0,
            content: "Poem1 Line",
            authorDevice: "a",
            passerDevice: "",
            editLength: 0,
            addedAt: new Date(),
        });
        editor1.contributionQueue.push(poem1);

        const poem2 = new Poem(io, "ROOM1", 5, 1);
        poem2.lines.add({
            ID: poem2.ID,
            contributionIndex: 0,
            content: "Poem2 Line",
            authorDevice: "b",
            passerDevice: "",
            editLength: 0,
            addedAt: new Date(),
        });
        editor2.contributionQueue.push(poem2);

        io.emissions.length = 0;
        spectator.sendAllPoemLines();

        const lineEmissions = io.emissions.filter(
            (e: any) => e.target === "spec-sock" && e.event === "stcLineSpectator",
        );
        assert.equal(lineEmissions.length, 2);
    });

    it("reinstateContext sends room code, user table info, poem lines, and completed poems", () => {
        const editor = new PoemEditor(io, createMockSocket("ed-sock"), "ROOM1", "ed-dev", "Editor1");
        room.addEditor("ed-dev", editor as any);

        const poem = new Poem(io, "ROOM1", 3, 0);
        poem.lines.add({
            ID: poem.ID,
            contributionIndex: 0,
            content: "Active line",
            authorDevice: "a",
            passerDevice: "",
            editLength: 0,
            addedAt: new Date(),
        });
        editor.contributionQueue.push(poem);

        io.emissions.length = 0;
        spectator.reinstateContext();

        // Should emit stcRoomCode (from Member.reinstateContext)
        const roomCodeEmission = io.emissions.find((e: any) => e.target === "spec-sock" && e.event === "stcRoomCode");
        assert.ok(roomCodeEmission);

        // Should emit stcUserTableInfo (from Member.reinstateContext)
        const userTableEmission = io.emissions.find(
            (e: any) => e.target === "spec-sock" && e.event === "stcUserTableInfo",
        );
        assert.ok(userTableEmission);

        // Should emit stcLineSpectator for in-progress poem lines
        const lineEmissions = io.emissions.filter(
            (e: any) => e.target === "spec-sock" && e.event === "stcLineSpectator",
        );
        assert.equal(lineEmissions.length, 1);
        assert.equal(lineEmissions[0].args[1], "Active line");
    });
});

describe("DrawingSpectator", () => {
    let io: ReturnType<typeof createMockIO>;
    let room: InstanceType<typeof DrawingRoom>;
    let spectator: InstanceType<typeof DrawingSpectator>;

    beforeEach(() => {
        io = createMockIO();
        room = new DrawingRoom(io, createMockSocket("host"), "DRAW1");
        roomIDToRoom.set("DRAW1", room);
        spectator = new DrawingSpectator(io, createMockSocket("spec-sock"), "DRAW1", "spec-dev", "Spectator1");
    });

    afterEach(() => {
        clearInterval(room.activityInterval);
        roomIDToRoom.clear();
        delete deviceIDToRoomID["spec-dev"];
        delete socketIDToDeviceID["spec-sock"];
        delete deviceIDToSocketID["spec-dev"];
    });

    it("sendAllDrawingPanels sends existing panels to spectator", () => {
        const editor = new DrawingEditor(io, createMockSocket("ed-sock"), "DRAW1", "ed-dev", "Editor1");
        room.addEditor("ed-dev", editor as any);

        const drawing = new Drawing(io, "DRAW1", 3, 0);
        const panel1: Point[][] = [[{ x: 10, y: 20, lineWidth: 2, color: "#f00" }]];
        const panel2: Point[][] = [[{ x: 30, y: 40, lineWidth: 3, color: "#0f0" }]];
        drawing.submitPanel("ed-dev", panel1);
        drawing.submitPanel("ed-dev", panel2);
        editor.contributionQueue.push(drawing);

        io.emissions.length = 0;
        spectator.sendAllDrawingPanels();

        const panelEmissions = io.emissions.filter(
            (e: any) => e.target === "spec-sock" && e.event === "stcPanelSpectator",
        );
        assert.equal(panelEmissions.length, 2);
        assert.deepEqual(panelEmissions[0].args[1], panel1);
        assert.deepEqual(panelEmissions[1].args[1], panel2);
    });

    it("sendAllDrawingPanels sends panels from multiple drawings across editors", () => {
        const editor1 = new DrawingEditor(io, createMockSocket("ed-sock-1"), "DRAW1", "ed-dev-1", "Editor1");
        const editor2 = new DrawingEditor(io, createMockSocket("ed-sock-2"), "DRAW1", "ed-dev-2", "Editor2");
        room.addEditor("ed-dev-1", editor1 as any);
        room.addEditor("ed-dev-2", editor2 as any);

        const drawing1 = new Drawing(io, "DRAW1", 3, 0);
        const content1: Point[][] = [[{ x: 1, y: 1, lineWidth: 1, color: "#000" }]];
        drawing1.submitPanel("ed-dev-1", content1);
        editor1.contributionQueue.push(drawing1);

        const drawing2 = new Drawing(io, "DRAW1", 3, 1);
        const content2: Point[][] = [[{ x: 2, y: 2, lineWidth: 2, color: "#fff" }]];
        drawing2.submitPanel("ed-dev-2", content2);
        editor2.contributionQueue.push(drawing2);

        io.emissions.length = 0;
        spectator.sendAllDrawingPanels();

        const panelEmissions = io.emissions.filter(
            (e: any) => e.target === "spec-sock" && e.event === "stcPanelSpectator",
        );
        assert.equal(panelEmissions.length, 2);
        // Drawing 0 panel
        assert.equal(panelEmissions[0].args[0], 0); // indexInGame
        assert.deepEqual(panelEmissions[0].args[1], content1);
        // Drawing 1 panel
        assert.equal(panelEmissions[1].args[0], 1); // indexInGame
        assert.deepEqual(panelEmissions[1].args[1], content2);
    });

    it("sendAllDrawingPanels handles empty contribution queues", () => {
        const editor = new DrawingEditor(io, createMockSocket("ed-sock"), "DRAW1", "ed-dev", "Editor1");
        room.addEditor("ed-dev", editor as any);
        // No drawings in queue

        io.emissions.length = 0;
        spectator.sendAllDrawingPanels();

        const panelEmissions = io.emissions.filter(
            (e: any) => e.target === "spec-sock" && e.event === "stcPanelSpectator",
        );
        assert.equal(panelEmissions.length, 0);
    });

    it("sendAllDrawingPanels handles no room gracefully", () => {
        roomIDToRoom.clear();
        // Should not throw
        spectator.sendAllDrawingPanels();
    });

    it("sendCanvas emits stcStrokeHistory with finishedCanvas", () => {
        const finishedCanvas: Point[][] = [[{ x: 5, y: 5, lineWidth: 1, color: "#abc" }]];
        room.finishedCanvas = finishedCanvas;

        io.emissions.length = 0;
        spectator.sendCanvas();

        const emission = io.emissions.find((e: any) => e.target === "spec-sock" && e.event === "stcStrokeHistory");
        assert.ok(emission);
        assert.deepEqual(emission!.args[0], finishedCanvas);
    });

    it("reinstateContext sends room code, user table, drawing panels, and completed drawings", () => {
        const editor = new DrawingEditor(io, createMockSocket("ed-sock"), "DRAW1", "ed-dev", "Editor1");
        room.addEditor("ed-dev", editor as any);

        const drawing = new Drawing(io, "DRAW1", 3, 0);
        const panelContent: Point[][] = [[{ x: 1, y: 2, lineWidth: 1, color: "#000" }]];
        drawing.submitPanel("ed-dev", panelContent);
        editor.contributionQueue.push(drawing);

        io.emissions.length = 0;
        spectator.reinstateContext();

        // Member.reinstateContext: stcRoomCode
        const roomCodeEmission = io.emissions.find((e: any) => e.target === "spec-sock" && e.event === "stcRoomCode");
        assert.ok(roomCodeEmission);

        // Member.reinstateContext: stcUserTableInfo
        const userTableEmission = io.emissions.find(
            (e: any) => e.target === "spec-sock" && e.event === "stcUserTableInfo",
        );
        assert.ok(userTableEmission);

        // sendAllDrawingPanels: stcPanelSpectator
        const panelEmissions = io.emissions.filter(
            (e: any) => e.target === "spec-sock" && e.event === "stcPanelSpectator",
        );
        assert.equal(panelEmissions.length, 1);
        assert.deepEqual(panelEmissions[0].args[1], panelContent);
    });

    it("spectator receives panel updates from submitPanel during gameplay", () => {
        const editor = new DrawingEditor(io, createMockSocket("ed-sock"), "DRAW1", "ed-dev", "Editor1");
        room.addEditor("ed-dev", editor as any);

        const drawing = new Drawing(io, "DRAW1", 3, 0);
        editor.contributionQueue.push(drawing);

        // Simulate editor submitting a panel during gameplay
        const panelContent: Point[][] = [
            [{ x: 10, y: 20, lineWidth: 2, color: "#ff0000" }],
            [{ x: 30, y: 40, lineWidth: 1, color: "#00ff00" }],
        ];
        drawing.submitPanel("ed-dev", panelContent);

        // The submitPanel should emit to spectators room
        const emission = io.emissions.find(
            (e: any) => e.target === "DRAW1_Spectators" && e.event === "stcPanelSpectator",
        );
        assert.ok(emission, "spectators should receive panel updates via room broadcast");
        assert.equal(emission!.args[0], 0); // drawing index
        assert.deepEqual(emission!.args[1], panelContent);
    });

    it("spectator receives panelEdit updates during live drawing", () => {
        const drawing = new Drawing(io, "DRAW1", 3, 0);

        const editContent: Point[][] = [[{ x: 5, y: 10, lineWidth: 1, color: "#000" }]];
        drawing.sendPanelEditToSpectators(editContent);

        const emission = io.emissions.find(
            (e: any) => e.target === "DRAW1_Spectators" && e.event === "stcPanelEditSpectator",
        );
        assert.ok(emission, "spectators should receive panel edit updates via room broadcast");
        assert.equal(emission!.args[0], 0); // drawing index
        assert.deepEqual(emission!.args[1], editContent);
    });

    it("reinstateContext catches up spectator who joins mid-game with multiple panels", () => {
        const editor = new DrawingEditor(io, createMockSocket("ed-sock"), "DRAW1", "ed-dev", "Editor1");
        room.addEditor("ed-dev", editor as any);

        // Simulate a drawing that already has 2 of 3 panels
        const drawing = new Drawing(io, "DRAW1", 3, 0);
        const panel1: Point[][] = [[{ x: 1, y: 1, lineWidth: 1, color: "#111" }]];
        const panel2: Point[][] = [[{ x: 2, y: 2, lineWidth: 2, color: "#222" }]];
        drawing.submitPanel("ed-dev", panel1);
        drawing.submitPanel("other-dev", panel2);
        editor.contributionQueue.push(drawing);

        io.emissions.length = 0;
        spectator.reinstateContext();

        // Should receive both existing panels
        const panelEmissions = io.emissions.filter(
            (e: any) => e.target === "spec-sock" && e.event === "stcPanelSpectator",
        );
        assert.equal(panelEmissions.length, 2);
        assert.deepEqual(panelEmissions[0].args[1], panel1);
        assert.deepEqual(panelEmissions[1].args[1], panel2);
    });
});
