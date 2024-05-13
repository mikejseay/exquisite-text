import isNil from "lodash/isNil";
import { Server, Socket } from "socket.io";

import {
    deviceIDToRoomID,
    deviceIDToSocketID,
    roomIDToRoom,
    socketIDToDeviceID,
} from "./globals";
import type Poem from "./collaboration";
import {
    ClientToServerEvents,
    InterServerEvents,
    ServerToClientEvents,
    SocketData,
} from "../../src/types";
import { userInfo as userInfoTestData } from "../../src/data/userInfo";
import { poemsLines as poemsLinesTestData } from "../../src/data/multiplePoems";

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

    // setSend
    // errors about join fail
    // command to go to a certain view
    // supply lobby subscription to keep game view up to date during configuration
    // supply completed poems

    // setReceive
    // getUserTableInfo

    setReceive() {
        this.socket.on("ctsRequestUserTableInfo", (shouldTest) => this.sendUserTableInfo(shouldTest));
        this.socket.on("ctsRequestPoemsLines", (shouldTest) => this.sendPoemsLinesInfo(shouldTest));
        this.socket.on("ctsRequestGameSettingsInfo", () => this.sendGameSettingsInfo());
        this.socket.on("ctsRequestSettingsEnabled", () => this.sendSettingsEnabled());
        this.socket.on("ctsLeave", () => this.leaveRoom());

        // These are all reserved events
        this.socket.on("disconnect", () => this.disconnect());
        this.socket.on("disconnecting", () => this.disconnecting());
    }

    unsetReceive() {
        this.socket.removeAllListeners("ctsRequestUserTableInfo");
        this.socket.removeAllListeners("ctsRequestPoemsLines");
        this.socket.removeAllListeners("ctsRequestGameSettingsInfo");
        this.socket.removeAllListeners("ctsRequestSettingsEnabled");
        this.socket.removeAllListeners("ctsLeave");
        this.socket.removeAllListeners("disconnect");
        this.socket.removeAllListeners("disconnecting");
    }

    sendUserTableInfo(shouldTest: boolean) {
        console.log(this.name, "requestUserTableInfo");
        if (!roomIDToRoom || !this.roomID) {
            console.log("roomIDToRoom not found");
            return;
        }
        const roomID = roomIDToRoom.get(this.roomID);
        if (!roomID) {
            console.log("roomID not found");
            return;
        }
        this.io
            .to(this.socket.id)
            .emit(
                "stcUserTableInfo",
                shouldTest
                    ? userInfoTestData
                    : roomID.currentUserTableInfo(),
            );
    }

    sendPoemsLinesInfo(shouldTest: boolean) {
        const thisRoom = roomIDToRoom.get(this.roomID);

        if (shouldTest) {
            console.log("sending test poemsLines data in a way that is unusual");
            // poemsLinesTestData is an array of arrays of lines
            for (const linesArray of poemsLinesTestData) {
                this.io
                    .to(this.socket.id)
                    .emit(
                        "stcPoemLines",
                        linesArray,
                    );
            }
            return;
        }

        if (!thisRoom) {
            console.log("thisRoom not found");
            return;
        }
        console.log(this.name, "request poems from room which has", thisRoom.finishedPoems.length);
        for (const poemObj of thisRoom.finishedPoems) {
            // TODO: Explore this, this could improve server-side efficiency:
            // this.io.in(this.roomID).emit("stcPoemLines", Array.from(poemObj.lines));
            this.io
                .to(this.socket.id)
                .emit(
                    "stcPoemLines",
                    Array.from(poemObj.lines),
                );
        }
    }

    requestRoomCode() {
        console.log(this.name, "requestRoomCode");
        this.io.to(this.socket.id).emit("stcRoomCode", this.roomID);
    }

    sendGameSettingsInfo() {
        console.log(this.name, "requestGameSettingsInfo");
        if (!roomIDToRoom || !this.roomID) {
            console.log("roomIDToRoom not found");
            return;
        }
        this.io
            .to(this.socket.id)
            .emit("stcGameSettingsInfo", roomIDToRoom.get(this.roomID)!.gameSettings);
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

        // if in the room but the game hasn't started yet (lobby), remove them
        const thisRoom = roomIDToRoom.get(this.roomID);
        if (!isNil(thisRoom) && !thisRoom.gameOngoing) {
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

    sendPoemAsLines(poemObj: Poem) {
    // crucial method that sends the poem to all users
    // make sure the correct members receive this
        this.io.in(this.roomID).emit("stcPoemLines", Array.from(poemObj.lines));
    }
}

export default Member;
