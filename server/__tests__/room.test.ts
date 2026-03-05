import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

import { DrawingRoom, PoemRoom } from "../modules/room";
import { createMockIO, createMockSocket } from "./helpers";
import { deviceIDToRoomID, deviceIDToSocketID, roomIDToHost, roomIDToRoom, socketIDToDeviceID } from "../modules/globals";
import { GameState, Medium } from "../../src/types";
import { defaultGameSettings, editorColorDefaultsArr } from "../../src/constants";

describe("PoemRoom", () => {
    let io: ReturnType<typeof createMockIO>;
    let hostSocket: ReturnType<typeof createMockSocket>;
    let room: InstanceType<typeof PoemRoom>;

    beforeEach(() => {
        io = createMockIO();
        hostSocket = createMockSocket("host-socket");
        room = new PoemRoom(io, hostSocket, "ROOM1");
    });

    afterEach(() => {
        clearInterval(room.activityInterval);
        roomIDToRoom.clear();
        roomIDToHost.clear();
    });

    it("initializes with correct defaults", () => {
        assert.equal(room.roomID, "ROOM1");
        assert.equal(room.gameState, GameState.LOBBY);
        assert.equal(room.medium, Medium.POETRY);
        assert.equal(room.editors.size, 0);
        assert.equal(room.spectators.size, 0);
        assert.equal(room.nUnfinishedWorks, 0);
        assert.deepEqual(room.finishedWorks, []);
        assert.deepEqual(room.gameSettings, defaultGameSettings);
    });

    it("addEditor adds an editor and triggers user table info emission", () => {
        const mockEditor = { name: "Alice", deviceID: "dev-1", prepareForGame() {} } as any;
        room.addEditor("dev-1", mockEditor);

        assert.equal(room.editors.size, 1);
        assert.equal(room.editors.get("dev-1"), mockEditor);
        // Should have emitted stcUserTableInfo
        assert.ok(io.emissions.some((e: any) => e.event === "stcUserTableInfo"));
    });

    it("removeEditor removes an editor", () => {
        const mockEditor = { name: "Alice", deviceID: "dev-1", prepareForGame() {} } as any;
        room.addEditor("dev-1", mockEditor);
        room.removeEditor("dev-1");

        assert.equal(room.editors.size, 0);
    });

    it("addSpectator and removeSpectator work correctly", () => {
        const mockSpectator = { name: "Bob" } as any;
        room.addSpectator("dev-2", mockSpectator);
        assert.equal(room.spectators.size, 1);

        room.removeSpectator("dev-2");
        assert.equal(room.spectators.size, 0);
    });

    it("currentUserTableInfo returns editors and spectators names/colors", () => {
        room.addEditor("dev-1", { name: "Alice", deviceID: "dev-1" } as any);
        room.addEditor("dev-2", { name: "Bob", deviceID: "dev-2" } as any);
        room.addSpectator("dev-3", { name: "Charlie" } as any);

        const info = room.currentUserTableInfo();
        assert.deepEqual(info.editors, [ "Alice", "Bob" ]);
        assert.deepEqual(info.spectators, [ "Charlie" ]);
        assert.equal(info.editorColors.length, 2);
        assert.equal(info.editorColors[0], editorColorDefaultsArr[0]);
        assert.equal(info.editorColors[1], editorColorDefaultsArr[1]);
        assert.equal(info.editorColorMap["dev-1"], editorColorDefaultsArr[0]);
        assert.equal(info.editorColorMap["dev-2"], editorColorDefaultsArr[1]);
    });

    it("storePoem adds a poem to finishedWorks", () => {
        const poemObj = { ID: "poem-1" } as any;
        room.storePoem(poemObj);
        assert.equal(room.finishedWorks.length, 1);
        assert.equal(room.finishedWorks[0], poemObj);
    });

    it("navigateMembersToGame sets game state and emits navigation events", () => {
        const mockEditor = {
            name: "Alice",
            deviceID: "dev-1",
            sendActivity() {},
            sendLastContributionStatus() {},
        } as any;
        room.addEditor("dev-1", mockEditor);
        room.navigateMembersToGame();

        assert.equal(room.gameState, GameState.GAME);
        const editorNav = io.emissions.find(
            (e: any) => e.target === "ROOM1_Editors" && e.event === "stcNavigate",
        );
        const specNav = io.emissions.find(
            (e: any) => e.target === "ROOM1_Spectators" && e.event === "stcNavigate",
        );
        assert.ok(editorNav);
        assert.deepEqual(editorNav!.args, [ "/game" ]);
        assert.ok(specNav);
        assert.deepEqual(specNav!.args, [ "/spectate" ]);
    });

    it("hasPoemBot returns false when no bots", () => {
        room.addEditor("dev-1", { name: "Alice", deviceID: "dev-1" } as any);
        assert.equal(room.hasPoemBot(), false);
    });

    it("sendToEnd emits stcNavigate /end to room", () => {
        room.sendToEnd();
        const nav = io.emissions.find(
            (e: any) => e.target === "ROOM1" && e.event === "stcNavigate",
        );
        assert.ok(nav);
        assert.deepEqual(nav!.args, [ "/end" ]);
    });

    it("cleanUpMember cleans up globals", () => {
        const mockSocket = createMockSocket("sock-1");
        const member = {
            connected: true,
            socket: mockSocket,
            roomID: "ROOM1",
            unsetReceive() {},
        } as any;

        deviceIDToRoomID["dev-clean"] = "ROOM1";
        socketIDToDeviceID["sock-1"] = "dev-clean";
        deviceIDToSocketID["dev-clean"] = "sock-1";

        room.cleanUpMember("dev-clean", member);

        assert.equal(member.connected, false);
        assert.equal(deviceIDToRoomID["dev-clean"], undefined);
        assert.equal(socketIDToDeviceID["sock-1"], undefined);
        assert.equal(deviceIDToSocketID["dev-clean"], undefined);
    });

    it("checkActivity does not crash with empty room", () => {
        // Just ensure it runs without throwing
        room.checkActivity();
    });

    it("setUpGame distributes poems to editors and navigates", () => {
        room.gameSettings = { ...defaultGameSettings, nPoems: 2, nRounds: 1 };
        const editors = [
            {
                name: "Alice",
                deviceID: "dev-1",
                lastActivity: 0,
                prepareForGame() {},
                contributionQueue: [] as any[],
                isCurrentlyEditing: false,
                sendActivity() {},
                sendLastContributionStatus() {},
            } as any,
            {
                name: "Bob",
                deviceID: "dev-2",
                lastActivity: 0,
                prepareForGame() {},
                contributionQueue: [] as any[],
                isCurrentlyEditing: false,
                sendActivity() {},
                sendLastContributionStatus() {},
            } as any,
        ];
        room.editors.set("dev-1", editors[0]);
        room.editors.set("dev-2", editors[1]);

        room.setUpGame();

        // 2 poems should be distributed across the 2 editors
        const totalPoems = editors[0].contributionQueue.length + editors[1].contributionQueue.length;
        assert.equal(totalPoems, 2);
        assert.equal(room.nUnfinishedWorks, 2);
        assert.equal(room.gameState, GameState.GAME);
    });
});

describe("DrawingRoom", () => {
    let io: ReturnType<typeof createMockIO>;
    let room: InstanceType<typeof DrawingRoom>;

    beforeEach(() => {
        io = createMockIO();
        room = new DrawingRoom(io, createMockSocket("host"), "DRAW1");
    });

    afterEach(() => {
        clearInterval(room.activityInterval);
    });

    it("initializes with correct medium", () => {
        assert.equal(room.medium, Medium.DRAWING);
        assert.deepEqual(room.finishedCanvas, []);
    });

    it("storeDrawing adds a drawing to finishedWorks", () => {
        const drawingObj = { ID: "draw-1" } as any;
        room.storeDrawing(drawingObj);
        assert.equal(room.finishedWorks.length, 1);
    });

    it("setUpGame distributes drawings and navigates", () => {
        room.gameSettings = { ...defaultGameSettings, nDrawings: 1 };
        const editor = {
            name: "Alice",
            deviceID: "dev-1",
            lastActivity: 0,
            prepareForGame() {},
            contributionQueue: [] as any[],
            isCurrentlyEditing: false,
            sendActivity() {},
            sendLastContributionStatus() {},
        } as any;
        room.editors.set("dev-1", editor);

        room.setUpGame();

        assert.equal(editor.contributionQueue.length, 1);
        assert.equal(room.nUnfinishedWorks, 1);
        assert.equal(room.gameState, GameState.GAME);
    });

    it("sendCompletedDrawings emits to room", () => {
        room.finishedWorks.push({
            panels: new Set([ { content: [ [ { x: 0, y: 0, lineWidth: 1, color: "#000" } ] ] } ]),
        } as any);

        room.sendCompletedDrawings();

        const emission = io.emissions.find(
            (e: any) => e.event === "stcCompletedDrawings",
        );
        assert.ok(emission);
    });
});
