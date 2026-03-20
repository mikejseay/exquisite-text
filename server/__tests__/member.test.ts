import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { createMockIO, createMockSocket } from "__tests__/helpers";
import { deviceIDToRoomID, deviceIDToSocketID, roomIDToRoom, socketIDToDeviceID } from "modules/globals";
import Member from "modules/member";
import { PoemRoom } from "modules/room";
import { GameState } from "shared/types/types";

describe("Member", () => {
    let io: ReturnType<typeof createMockIO>;
    let socket: ReturnType<typeof createMockSocket>;
    let member: InstanceType<typeof Member>;
    let room: InstanceType<typeof PoemRoom>;

    beforeEach(() => {
        io = createMockIO();
        socket = createMockSocket("member-sock");
        room = new PoemRoom(io, createMockSocket("host"), "ROOM1");
        roomIDToRoom.set("ROOM1", room);
        member = new Member(io, socket, "ROOM1", "dev-1", "TestUser");
    });

    afterEach(() => {
        clearInterval(room.activityInterval);
        roomIDToRoom.clear();
        delete deviceIDToRoomID["dev-1"];
        delete socketIDToDeviceID["member-sock"];
        delete deviceIDToSocketID["dev-1"];
    });

    it("initializes with correct properties", () => {
        assert.equal(member.roomID, "ROOM1");
        assert.equal(member.deviceID, "dev-1");
        assert.equal(member.name, "TestUser");
        assert.equal(member.connected, true);
        assert.ok(member.lastActivity > 0);
    });

    it("joinRoom sets connected and joins socket room", () => {
        member.joinRoom();
        assert.equal(member.connected, true);
        assert.ok(socket.rooms.has("ROOM1"));
    });

    it("leaveRoom sets connected to false and cleans up", () => {
        deviceIDToRoomID["dev-1"] = "ROOM1";
        member.joinRoom();
        member.leaveRoom();

        assert.equal(member.connected, false);
        assert.equal(deviceIDToRoomID["dev-1"], undefined);
        // Should have emitted navigate to "/"
        const navEmission = io.emissions.find((e: any) => e.target === "member-sock" && e.event === "stcNavigate");
        assert.ok(navEmission);
        assert.deepEqual(navEmission!.args, ["/"]);
    });

    it("disconnect sets connected to false", () => {
        socketIDToDeviceID["member-sock"] = "dev-1";
        deviceIDToSocketID["dev-1"] = "member-sock";
        member.disconnect();

        assert.equal(member.connected, false);
        assert.equal(socketIDToDeviceID["member-sock"], undefined);
        assert.equal(deviceIDToSocketID["dev-1"], undefined);
    });

    it("disconnect in LOBBY state calls leaveRoom", () => {
        room.gameState = GameState.LOBBY;
        deviceIDToRoomID["dev-1"] = "ROOM1";
        socketIDToDeviceID["member-sock"] = "dev-1";
        deviceIDToSocketID["dev-1"] = "member-sock";
        member.joinRoom();

        member.disconnect();

        // leaveRoom should have been called, emitting navigate "/"
        const navEmission = io.emissions.find(
            (e: any) => e.target === "member-sock" && e.event === "stcNavigate" && e.args[0] === "/",
        );
        assert.ok(navEmission);
    });

    it("requestRoomCode emits stcRoomCode", () => {
        member.requestRoomCode();

        const emission = io.emissions.find((e: any) => e.event === "stcRoomCode");
        assert.ok(emission);
        assert.deepEqual(emission!.args, ["ROOM1"]);
    });

    it("sendGameSettingsInfo emits room's game settings", () => {
        member.sendGameSettingsInfo();

        const emission = io.emissions.find((e: any) => e.event === "stcGameSettingsInfo");
        assert.ok(emission);
        assert.deepEqual(emission!.args[0], room.gameSettings);
    });

    it("sendSettingsEnabled emits false for base Member", () => {
        member.sendSettingsEnabled();

        const emission = io.emissions.find((e: any) => e.event === "stcGameSettingsEnabled");
        assert.ok(emission);
        assert.equal(emission!.args[0], false);
    });

    it("reinstateContext calls requestRoomCode and sendUserTableInfo", () => {
        member.reinstateContext();

        const roomCodeEmission = io.emissions.find((e: any) => e.event === "stcRoomCode");
        const userTableEmission = io.emissions.find((e: any) => e.event === "stcUserTableInfo");
        assert.ok(roomCodeEmission);
        assert.ok(userTableEmission);
    });
});
