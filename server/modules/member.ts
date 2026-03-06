import { isNil } from "es-toolkit";

import { deviceIDToRoomID, deviceIDToSocketID, roomIDToRoom, socketIDToDeviceID } from "./globals";
import { GameState, ServerToClientEvents } from "../../src/types";
import { userInfo as userInfoTestData } from "../../src/data/userInfo";
import { getRoom } from "../utilities/socketUtils";
import { logger } from "../utilities/loggerUtils";
import type { TypedServer, TypedSocket } from "../types";

class Member {
    // represents an Editor or Spectator (which extend this)
    // enforces deviceID constraint
    // (if the same device tries to be a member of the same room twice,
    // the old socket gets disconnected and removed and the new socket replaces it)

    io: TypedServer;
    socket: TypedSocket;
    roomID: string;
    deviceID: string;
    name: string;
    lastActivity: number;
    connected: boolean;
    private _registeredEvents: string[] = [];

    constructor(
        io: TypedServer,
        socket: TypedSocket,
        roomID: string,
        deviceID: string,
        name: string,
    ) {
        this.io = io;
        this.socket = socket;
        this.roomID = roomID;
        this.deviceID = deviceID;
        this.name = name;
        this.lastActivity = Date.now(); // current time since epoch in ms
        this.connected = true;
    }

    // Registers a socket event listener and tracks it for automatic cleanup in unsetReceive().
    // Subclasses use this in setReceive() instead of this.socket.on() directly,
    // eliminating the need to maintain a parallel unsetReceive() with the same event names.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected listen(event: string, handler: (...args: any[]) => void): void {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.socket.on(event as any, handler);
        this._registeredEvents.push(event);
    }

    // Emits a typed server-to-client event to this member's socket.
    protected emitToSelf<E extends keyof ServerToClientEvents>(
        event: E,
        ...args: Parameters<ServerToClientEvents[E]>
    ): void {
        this.io.to(this.socket.id).emit(event, ...args);
    }

    joinRoom() {
        this.connected = true;
        this.socket.join(this.roomID);
        this.setReceive(); // listen for certain messages from client
    }

    leaveRoom() {
        this.connected = false;
        logger.debug(`${this.name} leaving ${this.roomID}`);
        this.emitToSelf("stcNavigate", "/"); // navigate home (if possible)
        delete deviceIDToRoomID[this.deviceID];
        this.socket.leave(this.roomID);
        this.unsetReceive(); // remove listeners
    }

    setReceive() {
        this._registeredEvents = [];
        this.listen("ctsRequestUserTableInfo", (shouldTest) => this.sendUserTableInfo(shouldTest));
        this.listen("ctsRequestGameSettingsInfo", () => this.sendGameSettingsInfo());
        this.listen("ctsRequestSettingsEnabled", () => this.sendSettingsEnabled());
        this.listen("ctsLeave", () => this.leaveRoom());
        // These are all reserved events
        this.listen("disconnect", () => this.disconnect());
        this.listen("disconnecting", () => this.disconnecting());
    }

    // Removes all event listeners registered via listen().
    // Subclasses do NOT need to override this — listen() tracks all events automatically.
    unsetReceive() {
        for (const event of this._registeredEvents) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.socket.removeAllListeners(event as any);
        }
        this._registeredEvents = [];
    }

    sendUserTableInfo(shouldTest: boolean) {
        logger.debug(`${this.name} requestUserTableInfo`);
        const room = getRoom(this.roomID);
        if (room) {
            this.emitToSelf(
                "stcUserTableInfo",
                shouldTest
                    ? userInfoTestData
                    : room.currentUserTableInfo(),
            );
        } else {
            logger.debug("Failed to get room details for user table info");
        }
    }

    requestRoomCode() {
        logger.debug(`${this.name} requestRoomCode`);
        this.emitToSelf("stcRoomCode", this.roomID);
    }

    sendGameSettingsInfo() {
        logger.debug(`${this.name} requestGameSettingsInfo`);
        const room = getRoom(this.roomID);
        if (room) {
            this.emitToSelf("stcGameSettingsInfo", room.gameSettings);
        } else {
            logger.debug("Failed to get room details for game settings");
        }
    }

    sendSettingsEnabled() {
        logger.debug(`${this.name} requestSettingsEnabled`);
        this.emitToSelf("stcGameSettingsEnabled", false);
    }

    disconnect() {
    // note this could be called by something as simple as closing the tab
    // therefore we don't want to boot someone from the game based on this
    // however if they are AFK, etc., we should do those things

        logger.debug(`${this.socket.id} disconnected`);
        this.connected = false;

        // If game still in lobby state, remove user from room, since an AFK
        // user would be quite annoying right after the game starts.
        const room = roomIDToRoom.get(this.roomID);
        if (!isNil(room) && room.gameState === GameState.LOBBY) {
            this.leaveRoom();
        }

        // socketIDToDeviceID
        delete socketIDToDeviceID[this.socket.id];
        // deviceIDToSocketID
        delete deviceIDToSocketID[this.deviceID];
        // roomIDToRoom

        // do cleanup intelligently
        // remove from socket map
        // notice that we don't remove from the other maps
        // this gives opportunity for the person to reconnect...
        // but eventually we might have to remove them if they're inactive

    // two-minute timer to boot completely from the Room?
    }

    disconnecting() {
        logger.debug(`socket ${this.socket.id} disconnecting from ${this.socket.rooms}`);
    }

    reinstateContext() {
        this.requestRoomCode();
        this.sendUserTableInfo(false);
    }
}

export default Member;
