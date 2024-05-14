import { Server, Socket } from "socket.io";

import { deviceIDToRoomID, deviceIDToSocketID, roomIDToHost, roomIDToRoom, socketIDToDeviceID } from "./globals";
import Spectator from "./spectator";
import Editor from "./editor";
import Poem from "./collaboration";
import {
    ClientToServerEvents,
    IGameSettingsInfo,
    IUserTableInfo,
    InterServerEvents,
    Point,
    ServerToClientEvents,
    SocketData,
} from "../../src/types";
import {
    checkActivityInterval,
    defaultGameSettings,
    editorColorDefaultsArr,
    maxMemberTimeSpentInactive,
    maxRoomTimeSpentEmpty,
} from "../../src/constants";
import { sleep } from "../../src/helpers";

class Room {
    // represents a socket.io room and a game of Exquisite Text
    io: Server<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
    >;
    hostSocket: null | Socket<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
    >;
    roomID: string;

    editors: Map<string, Editor>;
    spectators: Map<string, Spectator>;
    gameOngoing: boolean;
    nUnfinishedWorks: number;
    activityInterval: ReturnType<typeof setInterval>;
    createdAt: number;

    constructor(
        io: Server<
            ClientToServerEvents,
            ServerToClientEvents,
            InterServerEvents,
            SocketData
        >,
        hostSocket: Socket,
        room: string,
    ) {
        this.io = io;
        this.hostSocket = hostSocket;
        this.roomID = room;

        this.editors = new Map(); // deviceID to editorObj
        this.spectators = new Map(); // deviceID to spectatorObj
        this.gameOngoing = false;
        this.nUnfinishedWorks = 0;

        // check user activity every 30 seconds
        this.activityInterval = setInterval(
            this.checkActivity.bind(this),
            checkActivityInterval,
        );
        this.createdAt = Date.now();
    }

    addEditor(deviceUUID: string, editorObj: Editor) {
        console.log("addEditor with deviceUUID", deviceUUID);
        this.editors.set(deviceUUID, editorObj);
        this.sendCurrentUserTableInfo(); // give the room updated user info
    }

    removeEditor(deviceUUID: string) {
        console.log("removeEditor with deviceUUID", deviceUUID);
        this.editors.delete(deviceUUID);
        this.sendCurrentUserTableInfo(); // give the room updated user info
    }

    addSpectator(deviceUUID: string, spectatorObj: Spectator) {
        this.spectators.set(deviceUUID, spectatorObj);
        this.sendCurrentUserTableInfo(); // give the room updated user info
    }

    removeSpectator(deviceUUID: string) {
        this.spectators.delete(deviceUUID);
        this.sendCurrentUserTableInfo(); // give the room updated user info
    }

    currentUserTableInfo() {
        const editorNames: IUserTableInfo["editors"] = [];
        const editorColors: IUserTableInfo["editorColors"] = [];
        const spectatorNames: IUserTableInfo["spectators"] = [];
        const editorColorMap: IUserTableInfo["editorColorMap"] = {};
        let editorIndex = 0;
        for (const thisEditor of this.editors.values()) {
            editorNames.push(thisEditor.name);
            editorColors.push(editorColorDefaultsArr[editorIndex]);
            editorColorMap[thisEditor.deviceID] = editorColorDefaultsArr[editorIndex];
            editorIndex++;
        }
        for (const thisSpectator of this.spectators.values()) {
            spectatorNames.push(thisSpectator.name);
        }
        return {
            editors: editorNames,
            spectators: spectatorNames,
            editorColorMap: editorColorMap,
            editorColors: editorColors,
        };
    }

    sendCurrentUserTableInfo() {
        this.io.in(this.roomID).emit("stcUserTableInfo", this.currentUserTableInfo());
    }

    reorganizeEditors() {
        for (const thisEditor of this.editors.values()) {
            thisEditor.prepareForGame();
        }
    }

    checkActivity() {
        const currentTime = Date.now();
        console.log(this.roomID, "checking activity at", currentTime);
        if (
            this.editors.size === 0 &&
            this.spectators.size === 0 &&
            currentTime - this.createdAt > maxRoomTimeSpentEmpty
        ) {
            console.log(this.roomID, "spent too long with no members, destroying");
            this.selfDestruct();
            return;
        }
        for (const thisSpectator of this.spectators.values()) {
            if (
                !thisSpectator.connected &&
                currentTime - thisSpectator.lastActivity > maxMemberTimeSpentInactive
            ) {
                thisSpectator.leaveRoom();
                console.log("booting", thisSpectator.name, "based on inactivity");
            }
        }
        for (const thisEditor of this.editors.values()) {
            if (
                thisEditor.isCurrentlyEditing &&
                currentTime - thisEditor.lastActivity > maxMemberTimeSpentInactive
            ) {
                thisEditor.leaveRoom();
                console.log("booting", thisEditor.name, "based on inactivity");
            }
        }
    }

    sendToEnd() {
        console.log(this.roomID, "sending everyone to the end screen");
        this.io.in(this.roomID).emit("stcNavigate", "/end");
    }

    async selfDestruct() {
        console.log(this.roomID, "will self-destruct in 30 seconds");
        await sleep(30000);
        console.log(this.roomID, "self-destructing");

        for (const [ editorID, thisEditor ] of this.editors.entries()) {
            delete deviceIDToRoomID[editorID];
            // since this.editors is a map from editor's device ID to the Member this should delete the object
            // including its socket?
            thisEditor.connected = false;
            delete deviceIDToRoomID[editorID];
            thisEditor.socket.leave(this.roomID);
            thisEditor.unsetReceive();
            delete socketIDToDeviceID[thisEditor.socket.id];
            delete deviceIDToSocketID[editorID];
            this.editors.delete(editorID);
        }
        for (const [
            spectatorID,
            thisSpectator,
        ] of this.spectators.entries()) {
            delete deviceIDToRoomID[spectatorID];
            thisSpectator.connected = false;
            delete deviceIDToRoomID[spectatorID];
            thisSpectator.socket.leave(this.roomID);
            thisSpectator.unsetReceive();
            delete socketIDToDeviceID[thisSpectator.socket.id];
            delete deviceIDToSocketID[spectatorID];
            this.spectators.delete(spectatorID);
        }

        clearInterval(this.activityInterval);
        roomIDToHost.delete(this.roomID);
        roomIDToRoom.delete(this.roomID);
    }
}

class PoemRoom extends Room {
    gameSettings: IGameSettingsInfo;
    finishedWorks: Array<Poem>;
    finishedCanvas: Point[][];

    constructor(
        io: Server<ClientToServerEvents,
            ServerToClientEvents,
            InterServerEvents,
            SocketData>,
        hostSocket: Socket,
        room: string,
    ) {
        super(io, hostSocket, room);
        this.gameSettings = defaultGameSettings;
        this.finishedWorks = [];
        this.finishedCanvas = [];
    }

    storePoem(poemObj: Poem) {
        console.log(this.roomID, "storing poem", poemObj.ID);
        this.finishedWorks.push(poemObj);
    }

    setUpGame() {
        console.log("setUpGame with this.editors", this.editors);
        const nParts = this.gameSettings["nRounds"] * this.editors.size + 2;

        // have each editor set their important properties
        let nPoemsToHandOut = this.gameSettings["nPoems"];
        this.nUnfinishedWorks = nPoemsToHandOut;
        let poemIndex = 0;
        for (const thisEditor of this.editors.values()) {
            thisEditor.lastActivity = Date.now(); // refresh AFK timers upon game start
            thisEditor.prepareForGame();

            // give the editor a new poem
            if (nPoemsToHandOut > 0) {
                const thisPoem = new Poem(this.io, this.roomID, nParts, poemIndex); // creates Poem object
                thisEditor.poemQueue.push(thisPoem);
                thisEditor.isCurrentlyEditing = true;
                nPoemsToHandOut--;
                poemIndex++;
            }
        }

        // should tell editors to navigate to /game and spectators to /spectate
        this.io.in(`${this.roomID}_Editors`).emit("stcNavigate", "/game");
        this.io.in(`${this.roomID}_Spectators`).emit("stcNavigate", "/spectate");
        this.gameOngoing = true;

        for (const thisEditor of this.editors.values()) {
            thisEditor.sendActivity();
            thisEditor.sendLastLineStatus();
        }
    }

}

export default PoemRoom;
