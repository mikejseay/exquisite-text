import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { createMockIO, createMockSocket } from "__tests__/helpers";
import { roomIDToRoom } from "modules/globals";
import { PoemRoom } from "modules/room";
import { GameState, Role } from "shared/types/types";
import { getEditorSocketID, getRoom, getRouteForGameStateAndRole } from "utilities/socketUtils";

describe("getRouteForGameStateAndRole", () => {
    it("returns /lobby for LOBBY state regardless of role", () => {
        assert.equal(getRouteForGameStateAndRole(GameState.LOBBY, Role.EDITOR), "/lobby");
        assert.equal(getRouteForGameStateAndRole(GameState.LOBBY, Role.SPECTATOR), "/lobby");
    });

    it("returns /end for END state regardless of role", () => {
        assert.equal(getRouteForGameStateAndRole(GameState.END, Role.EDITOR), "/end");
        assert.equal(getRouteForGameStateAndRole(GameState.END, Role.SPECTATOR), "/end");
    });

    it("returns /game for GAME state + EDITOR role", () => {
        assert.equal(getRouteForGameStateAndRole(GameState.GAME, Role.EDITOR), "/game");
    });

    it("returns /spectate for GAME state + SPECTATOR role", () => {
        assert.equal(getRouteForGameStateAndRole(GameState.GAME, Role.SPECTATOR), "/spectate");
    });
});

describe("getRoom", () => {
    const io = createMockIO();
    const socket = createMockSocket();

    afterEach(() => {
        roomIDToRoom.clear();
    });

    it("returns undefined for undefined roomID", () => {
        assert.equal(getRoom(undefined), undefined);
    });

    it("returns undefined for non-existent roomID", () => {
        assert.equal(getRoom("nonexistent"), undefined);
    });

    it("returns the room when it exists", () => {
        const room = new PoemRoom(io, socket, "ABCD");
        roomIDToRoom.set("ABCD", room);
        assert.equal(getRoom("ABCD"), room);
    });
});

describe("getEditorSocketID", () => {
    const io = createMockIO();

    afterEach(() => {
        roomIDToRoom.clear();
    });

    it("returns undefined when roomID is undefined", () => {
        assert.equal(getEditorSocketID(undefined, "editor-1"), undefined);
    });

    it("returns undefined when editorID is undefined", () => {
        assert.equal(getEditorSocketID("ABCD", undefined), undefined);
    });

    it("returns undefined when room does not exist", () => {
        assert.equal(getEditorSocketID("ABCD", "editor-1"), undefined);
    });

    it("returns the socket ID of the editor when found", () => {
        const room = new PoemRoom(io, createMockSocket("host-socket"), "ABCD");
        roomIDToRoom.set("ABCD", room);

        const editorSocket = createMockSocket("editor-socket-123");
        // Manually add an editor-like object to the room's editors map
        room.editors.set("device-1", {
            socket: editorSocket,
            deviceID: "device-1",
            name: "TestEditor",
        } as any);

        assert.equal(getEditorSocketID("ABCD", "device-1"), "editor-socket-123");
    });

    it("returns undefined when editor not found in room", () => {
        const room = new PoemRoom(io, createMockSocket("host-socket"), "ABCD");
        roomIDToRoom.set("ABCD", room);
        assert.equal(getEditorSocketID("ABCD", "nonexistent-editor"), undefined);
    });
});
