import isNil from "lodash/isNil";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid"; // a function that generates a random uuid for lines

import {
    ClientToServerEvents,
    IGameSettingsInfo,
    IPoem,
    InterServerEvents,
    Point,
    ServerToClientEvents,
    SocketData,
} from "../../src/types";
import { storePoem } from "../queries";
import { lineSepString } from "../../src/constants";

import {
    roomIdToRoom,
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
        console.log("prepareForGame in room", this.roomId);
        const thisRoom = roomIdToRoom.get(this.roomId);
        if (!thisRoom) {
            console.log("thisRoom not found");
            return;
        }
        const editorDeviceIDs = Array.from(thisRoom.editors.keys());
        console.log("editorDeviceIDs", editorDeviceIDs);
        const nEditors = editorDeviceIDs.length;
        console.log("nEditors", nEditors);
        this.turnPosition = editorDeviceIDs.indexOf(this.deviceID);
        console.log("this.turnPosition", this.turnPosition);
        const safeNextIndex = (this.turnPosition + 1) % nEditors;
        console.log("safeNextIndex", safeNextIndex);
        this.targetEditorID = editorDeviceIDs[safeNextIndex];
        console.log("this.targetEditorID", this.targetEditorID);
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
        if (!thisRoom) {
            console.log("thisRoom not found");
            return;
        }
        thisRoom.removeEditor(this.deviceID);

        if (thisRoom.gameOngoing) {
            // hand off any poems in your queue to the next person
            if (thisRoom.editors.size > 0) {
                const nextEditor = thisRoom.editors.get(this.targetEditorID);
                if (!nextEditor) {
                    console.log("nextEditor not found");
                    return;
                }
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

    receiveCanvas(strokeHistory: Point[][]) {
        console.log("receiveCanvas:", strokeHistory);
        const thisRoom = roomIdToRoom.get(this.roomId);
        if (!thisRoom || !thisRoom.editors) {
            console.log("thisRoom.editors not found");
            return;
        }
        thisRoom.finishedCanvas = strokeHistory;
    }

    setReceive() {
        super.setReceive();
        this.socket.on("ctsGetLineEdit", () => this.requestLineEdit()); // initial populate
        this.socket.on("ctsLineEdit", (value) => this.handleLineEdit(value)); //whenever the input box is edited.
        this.socket.on("ctsGetEditorActive", () => this.requestActivity());
        this.socket.on("ctsPassTurn", (firstPart, secondPart) =>
            this.handlePassTurn(firstPart, secondPart),
        );
        this.socket.on("ctsLastLine", (value) => this.handleLastLine(value)); // whenever a new line has been submitted into the poem.
        this.socket.on("ctsGetLastLineStatus", () => this.requestLastLineStatus());
        this.socket.on("ctsAlterGameSettings", (value) =>
            this.alterGameSettings(value),
        );
        this.socket.on("ctsStartGame", () => this.broadcastStartGame());
        this.socket.on("ctsSendCanvas", (value: Point[][]) => this.receiveCanvas(value));
    }

    unsetReceive() {
        super.unsetReceive();
        this.socket.removeAllListeners("ctsGetLineEdit");
        this.socket.removeAllListeners("ctsLineEdit");
        this.socket.removeAllListeners("ctsGetEditorActive");
        this.socket.removeAllListeners("ctsPassTurn");
        this.socket.removeAllListeners("ctsLastLine");
        this.socket.removeAllListeners("ctsGetLastLineStatus");
        this.socket.removeAllListeners("ctsAlterGameSettings");
        this.socket.removeAllListeners("ctsStartGame");
    }

    requestLineEdit() {
        // this is activated when the game view initially loads
        // this should fill in what it's supposed to based on
        // the halfLine of the first Poem in the queue (if this editor is active)

        if (this.hasPoemInQueue()) {
            this.io.to(this.socket.id).emit("stcLineEdit", this.poemQueue[0].halfLine);
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
        if (!thisRoom || !thisRoom.editors) {
            console.log("thisRoom.editors not found");
            return;
        }
        this.io
            .to(thisRoom.editors.get(this.targetEditorID)!.socket.id)
            .emit("stcLineEditorWatch", value);

        const thisPoem = this.poemQueue[0];
        if (!isNil(thisPoem)) {
            thisPoem.lineWasEdited(value);
        }
    }

    requestActivity() {
        console.log(this.name, "requestEditorActivity");
        this.io.to(this.socket.id).emit("stcEditorActive", this.hasPoemInQueue());
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
        this.io.to(this.socket.id).emit("stcLastLine", this.currentlyOnLastLine());
    }

    possibleStartNewTurn() {
        if (this.hasPoemInQueue()) {
            this.lastActivity = Date.now(); // give them some time to type
            this.io.to(this.socket.id).emit("stcLineEdit", this.poemQueue[0].halfLine);
            const thisPoem = this.poemQueue[0];
            console.log(
                "we think the poem has",
                thisPoem.lines.size,
                "submissions so far",
            );

            if (thisPoem.lines.size === thisPoem.targetLines - 2) {
                this.io.to(this.socket.id).emit("stcLastLine", true);
            } else {
                this.io.to(this.socket.id).emit("stcLastLine", false);
            }
            this.io.to(this.socket.id).emit("stcEditorActive", true);
            this.isCurrentlyEditing = true;
        } else {
            this.io.to(this.socket.id).emit("stcLineEdit", "");
            this.io.to(this.socket.id).emit("stcEditorActive", false);
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
        if (!thisRoom) {
            console.log("thisRoom not found");
            return;
        }
        const nextEditor = thisRoom.editors.get(this.targetEditorID);
        if (!nextEditor) {
            console.log("nextEditor not found");
            return;
        }
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

        // This is the last moment at which the server contains the full poem object (array of lines)
        // Most likely we should store the poem inside the room
        // So that we can pass them back to the members as needed
        this.handlePoem(poemToPass);

        const thisRoom = roomIdToRoom.get(this.roomId);
        if (!thisRoom) {
            console.log("thisRoom not found");
            return;
        }
        thisRoom.nPoemsInRotation--;
        // if all editors' poem queues are empty
        // remove each of the editor/spectator deviceIDs from deviceIDToRoomId
        if (thisRoom.nPoemsInRotation === 0) {
            console.log(
                "no poems left to finish; forget everyone's device, delete room and poem globals",
            );
            thisRoom.gameOngoing = false;
            thisRoom.sendToEnd();  // send everyone to the end screen
            thisRoom.selfDestruct();  // self-destruct after some time

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

        // save the poem into the Room object
        const thisRoom = roomIdToRoom.get(this.roomId);
        if (!thisRoom) {
            console.log("thisRoom not found");
            return;
        }
        thisRoom.storePoem(poemObj);

    }

    alterGameSettings(gameSettings: IGameSettingsInfo) {
        console.log("ctsAlterGameSettings");
        if (!roomIdToRoom ||  !roomIdToRoom.get || !this || !this.roomId) {
            console.log("thisRoom not found");
            return;
        }
        roomIdToRoom.get(this.roomId)!.gameSettings = gameSettings;
        this.socket.to(this.roomId).emit("stcGameSettingsInfo", gameSettings);
    }

    broadcastStartGame() {
        // global in nature, so it will mainly eal with the room
        console.log("ctsStartGame");
        roomIdToRoom.get(this.roomId)!.setUpGame();
    }

    requestSettingsEnabled() {
        console.log(this.name, "requestSettingsEnabled");
        this.io.to(this.socket.id).emit("stcGameSettingsEnabled", Boolean(this.isVIP()));
    }

    isVIP() {
        const thisRoom = roomIdToRoom.get(this.roomId);
        if (!thisRoom) {
            console.log("thisRoom not found");
            return;
        }
        return thisRoom.editors.keys().next().value === this.deviceID;
    }
}

export default Editor;
