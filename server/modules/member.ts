import isNil from "lodash/isNil";
import { Server, Socket } from "socket.io";

import { deviceIDToRoomID, deviceIDToSocketID, roomIDToRoom, socketIDToDeviceID } from "./globals";
import { ClientToServerEvents, GameState, InterServerEvents, ServerToClientEvents, SocketData } from "../../src/types";
import { userInfo as userInfoTestData } from "../../src/data/userInfo";
import { getRoom } from "../utilities/sockets";

class Member {
    // represents an Editor or Spectator (which extend this)
    // enforces deviceID constraint
    // (if the same device tries to be a member of the same room twice,
    // the old socket gets disconnected and removed and the new socket replaces it)

    io: Server<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
    >;
    socket: Socket<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
    >;
    roomID: string;
    deviceID: string;
    name: string;
    lastActivity: number;
    connected: boolean;

    constructor(
        io: Server<
            ClientToServerEvents,
            ServerToClientEvents,
            InterServerEvents,
            SocketData
        >,
        socket: Socket,
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

    joinRoom() {
        this.connected = true;
        this.socket.join(this.roomID);
        this.setReceive(); // listen for certain messages from client
    }

    leaveRoom() {
        this.connected = false;
        console.log(this.name, " leaving ", this.roomID);
        this.io.to(this.socket.id).emit("stcNavigate", "/"); // navigate home (if possible)
        delete deviceIDToRoomID[this.deviceID];
        this.socket.leave(this.roomID);
        this.unsetReceive(); // remove listeners
    }

    setReceive() {
        this.socket.on("ctsRequestUserTableInfo", (shouldTest) => this.sendUserTableInfo(shouldTest));
        this.socket.on("ctsRequestGameSettingsInfo", () => this.sendGameSettingsInfo());
        this.socket.on("ctsRequestSettingsEnabled", () => this.sendSettingsEnabled());
        this.socket.on("ctsLeave", () => this.leaveRoom());
        // These are all reserved events
        this.socket.on("disconnect", () => this.disconnect());
        this.socket.on("disconnecting", () => this.disconnecting());
    }

    unsetReceive() {
        this.socket.removeAllListeners("ctsRequestUserTableInfo");
        this.socket.removeAllListeners("ctsRequestGameSettingsInfo");
        this.socket.removeAllListeners("ctsRequestSettingsEnabled");
        this.socket.removeAllListeners("ctsLeave");
        this.socket.removeAllListeners("disconnect");
        this.socket.removeAllListeners("disconnecting");
    }

    sendUserTableInfo(shouldTest: boolean) {
        console.log(this.name, "requestUserTableInfo");
        const room = getRoom(this.roomID);
        if (room) {
            this.io
                .to(this.socket.id)
                .emit(
                    "stcUserTableInfo",
                    shouldTest
                        ? userInfoTestData
                        : room.currentUserTableInfo(),
                );
        } else {
            console.log("Failed to get room details for user table info");
        }
    }

    requestRoomCode() {
        console.log(this.name, "requestRoomCode");
        this.io.to(this.socket.id).emit("stcRoomCode", this.roomID);
    }

    sendGameSettingsInfo() {
        console.log(this.name, "requestGameSettingsInfo");
        const room = getRoom(this.roomID);
        if (room) {
            this.io
                .to(this.socket.id)
                .emit("stcGameSettingsInfo", room.gameSettings);
        } else {
            console.log("Failed to get room details for game settings");
        }
    }

    sendSettingsEnabled() {
        console.log(this.name, "requestSettingsEnabled");
        this.io.to(this.socket.id).emit("stcGameSettingsEnabled", false);
    }

    disconnect() {
    // note this could be called by something as simple as closing the tab
    // therefore we don't want to boot someone from the game based on this
    // however if they are AFK, etc., we should do those things

        console.log(this.socket.id, "disconnected");
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
        console.log(
            "socket",
            this.socket.id,
            " disconnecting from",
            this.socket.rooms,
        );
    }

    reinstateContext() {
        this.requestRoomCode();
        this.sendUserTableInfo(false);
    }
}

export default Member;
