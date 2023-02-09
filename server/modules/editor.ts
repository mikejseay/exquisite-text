import isNil from "lodash/isNil";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid"; // a function that generates a random uuid for lines

import {
    ClientToServerEvents,
    IGameSettingsInfo,
    IPoem,
    InterServerEvents,
    ServerToClientEvents,
    SocketData,
} from "../../src/types";
import { storePoem } from "../queries";
import { lineSepString } from "../../src/constants";

import {
    deviceIDToRoomId,
    deviceIDToSocketID,
    roomIdToRoom,
    socketIDToDeviceID,
} from "./globals";
import type Poem from "./poem";
import Member from "./member";

class Editor extends Member {
    targetEditorID: string;
    turnPosition: number;
    poemQueue: Array<Poem>;
    isCurrentlyEditing: boolean;

    constructor(
        io: Server<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
        hostSocket: Socket,
        roomId: string,
        deviceID: string,
        name: string,
    ) {
        super(io, hostSocket, roomId, deviceID, name);
        this.targetEditorID = "";
        // this.targetEditorSocketID = "";
        this.turnPosition = 0;
        this.poemQueue = [];
        this.isCurrentlyEditing = false;
    }

    prepareForGame() {
        const thisRoom = roomIdToRoom.get(this.roomId);
        const editorDeviceIDs = Array.from(
            thisRoom.editors.keys(),
        ) as Array<string>;
        const nEditors = editorDeviceIDs.length;
        this.turnPosition = editorDeviceIDs.indexOf(this.deviceID);
        const safeNextIndex = (this.turnPosition + 1) % nEditors;
        this.targetEditorID = editorDeviceIDs[safeNextIndex];
        // this.targetEditorSocketID = thisRoom.editors.get(this.targetEditorID).socket.id;
        console.log(
            this.deviceID,
            "in position",
            this.turnPosition,
            "targets",
            this.targetEditorID,
        );
    }

    joinRoom() {
        super.joinRoom();
        this.socket.join(this.roomId + "_Editors");
    }

    leaveRoom() {
        super.leaveRoom();
        this.socket.leave(this.roomId + "_Editors");
        const thisRoom = roomIdToRoom.get(this.roomId);
        thisRoom.removeEditor(this.deviceID);

        if (thisRoom.gameOngoing) {
            // hand off any poems in your queue to the next person
            if (thisRoom.editors.size > 0) {
                const nextEditor = thisRoom.editors.get(this.targetEditorID);
                nextEditor.poemQueue.push(...this.poemQueue);
                if (!nextEditor.isCurrentlyEditing) {
                    nextEditor.possibleStartNewTurn();
                }
                // trigger the room to reorganize the editors
                thisRoom.reorganizeEditors();
            } else {
                console.log(
                    "there are no editors left after the game started, no way to continue.",
                );
                thisRoom.selfDestruct();
            }
        } else {
            // if we are still in the lobby then tell first editor to check whether they are VIP
            const firstEditor = thisRoom.editors.values().next().value;
            if (!isNil(firstEditor)) {
                firstEditor.requestSettingsEnabled();
            }
        }
    }

    // setSend
    // super.setSend()
    // ((line1Chars, line2Chars) in previousEditor's lineInput)

    setReceive() {
        super.setReceive();
        this.socket.on("getLineEdit", () => this.requestLineEdit()); // initial populate
        this.socket.on("lineEdit", (value) => this.handleLineEdit(value)); //whenever the input box is edited.
        this.socket.on("getEditorActive", () => this.requestActivity());
        this.socket.on("passTurn", (firstPart, secondPart) =>
            this.handlePassTurn(firstPart, secondPart),
        );
        this.socket.on("lastLine", (value) => this.handleLastLine(value)); // whenever a new line has been submitted into the poem.
        this.socket.on("getLastLineStatus", () => this.requestLastLineStatus());
        this.socket.on("alterGameSettings", (value) =>
            this.alterGameSettings(value),
        );
        this.socket.on("startGame", () => this.broadcastStartGame());
    }

    unsetReceive() {
        super.unsetReceive();
        this.socket.removeAllListeners("getLineEdit");
        this.socket.removeAllListeners("lineEdit");
        this.socket.removeAllListeners("getEditorActive");
        this.socket.removeAllListeners("passTurn");
        this.socket.removeAllListeners("lastLine");
        this.socket.removeAllListeners("getLastLineStatus");
        this.socket.removeAllListeners("alterGameSettings");
        this.socket.removeAllListeners("startGame");
    }

    requestLineEdit() {
    // this is activated when the game view initially loads
    // this should fill in what it's supposed to based on
    // the halfLine of the first Poem in the queue (if this editor is active)

        if (this.hasPoemInQueue()) {
            this.io.to(this.socket.id).emit("lineEdit", this.poemQueue[0].halfLine);
        }
    }

    handleLineEdit(value: string) {
    // when an active editor changes the lineInput, broadcast this
    // to other editors and/or spectators so that they can "watch" them type

        // for other active editors (this version), they want the string

        // for other active editors (next version), all they would need to know is
        // the value.split(lineSepString).map(s => s.length), a 2-tuple of numbers

        // for the spectator, TBD

        // for now, only send to the next Editor in line (each watches who are behind them)

        this.lastActivity = Date.now(); // they typed = active

        const thisRoom = roomIdToRoom.get(this.roomId);
        this.io
            .to(thisRoom.editors.get(this.targetEditorID).socket.id)
            .emit("lineEditorWatch", value);

        const thisPoem = this.poemQueue[0];
        if (!isNil(thisPoem)) {
            thisPoem.lineWasEdited(value);
        }
    }

    requestActivity() {
        console.log(this.name, "requestEditorActivity");
        this.io.to(this.socket.id).emit("editorActive", this.hasPoemInQueue());
    }

    hasPoemInQueue() {
        return this.poemQueue.length > 0;
    }

    currentlyOnLastLine() {
        const thisPoem = this.poemQueue[0];
        if (thisPoem) {
            const currentLength = thisPoem.lines.size;
            console.log(
                "we think the poem has ",
                currentLength,
                "of",
                thisPoem.targetLines - 2,
            );
            return currentLength >= thisPoem.targetLines - 2;
        } else {
            return false;
        }
    }

    requestLastLineStatus() {
        console.log("requestLastLineStatus");
        this.io.to(this.socket.id).emit("lastLine", this.currentlyOnLastLine());
    }

    possibleStartNewTurn() {
        if (this.hasPoemInQueue()) {
            this.lastActivity = Date.now(); // give them some time to type
            this.io.to(this.socket.id).emit("lineEdit", this.poemQueue[0].halfLine);
            const thisPoem = this.poemQueue[0];
            console.log(
                "we think the poem has",
                thisPoem.lines.size,
                "submissions so far",
            );

            if (thisPoem.lines.size === thisPoem.targetLines - 2) {
                this.io.to(this.socket.id).emit("lastLine", true);
            } else {
                this.io.to(this.socket.id).emit("lastLine", false);
            }
            this.io.to(this.socket.id).emit("editorActive", true);
            this.isCurrentlyEditing = true;
        } else {
            this.io.to(this.socket.id).emit("lineEdit", "");
            this.io.to(this.socket.id).emit("editorActive", false);
            this.isCurrentlyEditing = false;
        } // otherwise, leave it the way it was?
    }

    handlePassTurn(firstPart: string, secondPart: string) {
        const thisRoom = roomIdToRoom.get(this.roomId);
        const poemToPass = this.poemQueue.shift();
        if (isNil(poemToPass)) {
            return;
        }

        poemToPass.submitLine(this.deviceID, firstPart, secondPart);
        poemToPass.lineWasEdited(secondPart);
        // should be a reference!!!
        const nextEditor = thisRoom.editors.get(this.targetEditorID);
        nextEditor.poemQueue.push(poemToPass);

        // trigger editors to check their queue and update their activity state
        // and view (i.e. the correct lineEdit if necessary)
        // only THIS editor should check its own queue and populate accordingly
        this.possibleStartNewTurn();
        if (!nextEditor.isCurrentlyEditing) {
            nextEditor.possibleStartNewTurn();
        }
    }

    handleLastLine(lastPart: string) {
        console.log("handleLastLine in ", this.name);
        const poemToPass = this.poemQueue.shift();
        if (isNil(poemToPass)) {
            return;
        }
        poemToPass.lines.add({
            poemID: poemToPass.poemID,
            lineIndex: poemToPass.lines.size,
            content: lastPart,
            authorDevice: this.deviceID,
            passerDevice: poemToPass.mostRecentEditor, // previous editor, starts at ""
            editLength: poemToPass.halfLine.length, // previous line length, starts at 0
            addedAt: new Date(),
        });

        this.handlePoem(poemToPass);

        const thisRoom = roomIdToRoom.get(this.roomId);
        thisRoom.nPoemsInRotation--;
        // if all editors' poem queues are empty
        // remove each of the editor/spectator deviceIDs from deviceIDToRoomId
        if (thisRoom.nPoemsInRotation === 0) {
            console.log(
                "no poems left to finish; forget everyone's device, delete room and poem globals",
            );
            thisRoom.gameOngoing = false;
            for (const [ editorID, thisEditor ] of thisRoom.editors.entries()) {
                delete deviceIDToRoomId[editorID];
                // since thisRoom.editors is a map from editor's device ID to the Member this should delete the object
                // including its socket?
                thisEditor.connected = false;
                delete deviceIDToRoomId[editorID];
                thisEditor.socket.leave(this.roomId);
                thisEditor.unsetReceive();
                delete socketIDToDeviceID[thisEditor.socket.id];
                delete deviceIDToSocketID[editorID];
                thisRoom.editors.delete(editorID);
            }
            for (const [
                spectatorID,
                thisSpectator,
            ] of thisRoom.spectators.entries()) {
                delete deviceIDToRoomId[spectatorID];
                thisSpectator.connected = false;
                delete deviceIDToRoomId[spectatorID];
                thisSpectator.socket.leave(this.roomId);
                thisSpectator.unsetReceive();
                delete socketIDToDeviceID[thisSpectator.socket.id];
                delete deviceIDToSocketID[spectatorID];
                thisRoom.spectators.delete(spectatorID);
            }
            thisRoom.selfDestruct();
            // console.log("deviceIDToRoomId", deviceIDToRoomId);
            // console.log("roomIdToHost", roomIdToHost);
            // console.log("roomIdToRoom", roomIdToRoom);
            // console.log("thisRoom.editors", thisRoom.editors);
            // console.log("thisRoom.spectators", thisRoom.spectators);
        }
    }

    handlePoem(poemObj: Poem) {
        let poemString = "";
        for (const line of poemObj.lines) {
            poemString += line.content + lineSepString;
        }

        const poem: IPoem = {
            content: poemString,
            createdAt: new Date(),
            id: uuidv4(),
            title: `exquisite text #${Math.round(Math.random() * 100)}`,
        };

        // add the poem to the database
        if (process.env.IS_LIBRARY_ENABLED === "true") {
            storePoem(poem);
        }

        // broadcast the poem to room members via sockets
        // this.sendPoem(poem);
        // try out the new view
        this.sendPoemAsLines(poemObj);
    }

    alterGameSettings(gameSettings: IGameSettingsInfo) {
        console.log("alterGameSettings");
        roomIdToRoom.get(this.roomId).gameSettings = gameSettings;
        this.socket.to(this.roomId).emit("gameSettingsInfo", gameSettings);
    }

    broadcastStartGame() {
    // global in nature, so it will mainly eal with the room
        console.log("startGame");
        roomIdToRoom.get(this.roomId).setUpGame();
    }

    requestSettingsEnabled() {
        console.log(this.name, "requestSettingsEnabled");
        this.io.to(this.socket.id).emit("gameSettingsEnabled", this.isVIP());
    }

    isVIP() {
        const thisRoom = roomIdToRoom.get(this.roomId);
        return thisRoom.editors.keys().next().value === this.deviceID;
    }
}

export default Editor;
