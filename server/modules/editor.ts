import isNil from "lodash/isNil";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid"; // a function that generates a random uuid for lines

import {
    ClientToServerEvents,
    IPoem,
    IPoemSettingsInfo,
    InterServerEvents,
    Point,
    ServerToClientEvents,
    SocketData,
} from "../../src/types";
import { storePoem } from "../queries";
import { lineSepString } from "../../src/constants";

import {
    roomIDToRoom,
} from "./globals";
import type { Poem } from "./collaboration";
import Member from "./member";
import { getEditorSocketID, getRoom } from "../utilities/sockets";

class Editor extends Member {
    targetEditorID: string;
    turnPosition: number;
    contributionQueue: Array<Poem>; // element type does not matter | Array<Drawing>;
    isCurrentlyEditing: boolean;

    constructor(
        io: Server<
            ClientToServerEvents,
            ServerToClientEvents,
            InterServerEvents,
            SocketData
        >,
        hostSocket: Socket,
        roomID: string,
        deviceID: string,
        name: string,
    ) {
        super(io, hostSocket, roomID, deviceID, name);
        this.targetEditorID = "";
        this.turnPosition = 0;
        this.contributionQueue = [];
        this.isCurrentlyEditing = false;
    }

    prepareForGame() {
        console.log("prepareForGame in room", this.roomID);
        const thisRoom = roomIDToRoom.get(this.roomID);
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
        this.socket.join(`${this.roomID}_Editors`);
    }

    leaveRoom() {
        super.leaveRoom();
        this.socket.leave(`${this.roomID}_Editors`);
        const thisRoom = getRoom(this.roomID);
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
                nextEditor.contributionQueue.push(...this.contributionQueue);
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
            const firstEditor: Editor | undefined = thisRoom.editors.values().next().value;
            if (!isNil(firstEditor)) {
                firstEditor.sendSettingsEnabled();
            }
        }
    }

    setReceive() {
        super.setReceive();
        this.socket.on("ctsRequestEditorActive", () => this.sendActivity());
    }

    unsetReceive() {
        super.unsetReceive();
        this.socket.removeAllListeners("ctsRequestEditorActive");
    }

    sendActivity() {
        console.log(this.name, "requestEditorActivity");
        this.io.to(this.socket.id).emit("stcEditorActive", this.hasWorkInQueue());
    }

    hasWorkInQueue() {
        return this.contributionQueue.length > 0;
    }

    sendSettingsEnabled() {
        console.log(this.name, "requestSettingsEnabled");
        this.io.to(this.socket.id).emit("stcGameSettingsEnabled", Boolean(this.isVIP()));
    }

    isVIP() {
        const thisRoom = roomIDToRoom.get(this.roomID);
        if (!thisRoom) {
            console.log("thisRoom not found");
            return;
        }
        return thisRoom.editors.keys().next().value === this.deviceID;
    }
}

export class PoemEditor extends Editor {

    setReceive() {
        super.setReceive();
        // parasitic for now
        this.socket.on("ctsSendCanvas", (value: Point[][]) => this.receiveCanvas(value));
        this.socket.on("ctsRequestLineEdit", () => this.sendLineEdit()); // initial populate
        this.socket.on("ctsEditLine", (value) => this.handleLineEdit(value)); // whenever the input box is edited.
        this.socket.on("ctsSendLineParts", (firstPart, secondPart) =>
            this.handleLineParts(firstPart, secondPart),
        );
        this.socket.on("ctsSendLastLine", (value) => this.handleLastLine(value)); // whenever a new line has been submitted into the poem.
        this.socket.on("ctsRequestLastLineStatus", () => this.sendLastLineStatus());
        this.socket.on("ctsAlterGameSettings", (value) =>
            this.alterGameSettings(value),
        );
        this.socket.on("ctsStartGame", () => this.broadcastStartGame());
    }

    unsetReceive() {
        super.unsetReceive();
        // parasitic for now
        this.socket.removeAllListeners("ctsSendCanvas");
        this.socket.removeAllListeners("ctsRequestLineEdit");
        this.socket.removeAllListeners("ctsEditLine");
        this.socket.removeAllListeners("ctsSendLineParts");
        this.socket.removeAllListeners("ctsSendLastLine");
        this.socket.removeAllListeners("ctsRequestLastLineStatus");
        this.socket.removeAllListeners("ctsAlterGameSettings");
        this.socket.removeAllListeners("ctsStartGame");
    }

    // parasitic for now
    receiveCanvas(strokeHistory: Point[][]) {
        console.log("receiveCanvas:", strokeHistory);
        const thisRoom = roomIDToRoom.get(this.roomID);
        if (!thisRoom || !thisRoom.editors) {
            console.log("thisRoom.editors not found");
            return;
        }
        thisRoom.finishedCanvas = strokeHistory;
    }

    alterGameSettings(gameSettings: IPoemSettingsInfo) {
        console.log("ctsAlterGameSettings");
        const room = getRoom(this.roomID);
        if (room) {
            room.gameSettings = gameSettings;
            this.socket.to(this.roomID).emit("stcGameSettingsInfo", gameSettings);
        }
    }

    broadcastStartGame() {
        // global in nature, so it will mainly eal with the room
        console.log("ctsStartGame");
        const room = getRoom(this.roomID);
        if (room) {
            room.setUpGame();
        }
    }

    sendLineEdit() {
        // this is activated when the game view initially loads
        // this should fill in what it's supposed to based on
        // the halfLine of the first Poem in the queue (if this editor is active)

        if (this.hasWorkInQueue()) {
            this.io.to(this.socket.id).emit("stcLineEdit", this.contributionQueue[0].halfLine);
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

        const socketID = getEditorSocketID(this.roomID, this.targetEditorID);
        if (socketID) {
            this.io
                .to(socketID)
                .emit("stcLineEditorWatch", value);
        } else {
            console.log("Failed to get editor socket ID");
        }
        const thisPoem = this.contributionQueue[0];
        if (!isNil(thisPoem)) {
            thisPoem.sendLineEditToSpectators(value);
        }
    }

    handleLineParts(firstPart: string, secondPart: string) {
        const thisRoom = roomIDToRoom.get(this.roomID);
        const poemToPass = this.contributionQueue.shift();
        if (isNil(poemToPass)) {
            return;
        }

        poemToPass.submitLine(this.deviceID, firstPart, secondPart);
        poemToPass.sendLineEditToSpectators(secondPart);
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
        nextEditor.contributionQueue.push(poemToPass);

        // trigger editors to check their queue and update their activity state
        // and view (i.e. the correct lineEdit if necessary)
        // only THIS editor should check its own queue and populate accordingly
        this.possibleStartNewTurn();
        if (!nextEditor.isCurrentlyEditing) {
            nextEditor.possibleStartNewTurn();
        }
    }

    possibleStartNewTurn() {
        if (this.hasWorkInQueue()) {
            this.lastActivity = Date.now(); // give them some time to type
            this.io.to(this.socket.id).emit("stcLineEdit", this.contributionQueue[0].halfLine);
            const thisPoem = this.contributionQueue[0];
            console.log(
                "we think the poem has",
                thisPoem.lines.size,
                "submissions so far",
            );

            if (thisPoem.lines.size === thisPoem.nContributions - 2) {
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

    currentlyOnLastLine() {
        const thisPoem = this.contributionQueue[0];
        if (thisPoem) {
            const currentLength = thisPoem.lines.size;
            console.log(
                "we think the poem has ",
                currentLength,
                "of",
                thisPoem.nContributions - 2,
            );
            return currentLength >= thisPoem.nContributions - 2;
        } else {
            return false;
        }
    }

    sendLastLineStatus() {
        console.log("requestLastLineStatus");
        this.io.to(this.socket.id).emit("stcLastLine", this.currentlyOnLastLine());
    }

    handleLastLine(lastPart: string) {
        console.log("handleLastLine in ", this.name);
        const poemToPass = this.contributionQueue.shift();
        if (isNil(poemToPass)) {
            return;
        }
        poemToPass.lines.add({
            ID: poemToPass.ID,
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

        const thisRoom = roomIDToRoom.get(this.roomID);
        if (!thisRoom) {
            console.log("thisRoom not found");
            return;
        }
        thisRoom.nUnfinishedWorks--;
        // if all editors' poem queues are empty
        // remove each of the editor/spectator deviceIDs from deviceIDToRoomId
        if (thisRoom.nUnfinishedWorks === 0) {
            console.log(
                "no poems left to finish; forget everyone's device, delete room and poem globals",
            );
            thisRoom.gameOngoing = false;
            thisRoom.sendToEnd();  // send everyone to the end screen
            thisRoom.selfDestruct();  // self-destruct after some time

            // console.log("deviceIDToRoomID", deviceIDToRoomID);
            // console.log("roomIDToHost", roomIDToHost);
            // console.log("roomIDToRoom", roomIDToRoom);
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
        const thisRoom = roomIDToRoom.get(this.roomID);
        if (!thisRoom) {
            console.log("thisRoom not found");
            return;
        }
        thisRoom.storePoem(poemObj);

    }

    sendPoemAsLines(poemObj: Poem) {
        // crucial method that sends the poem to all users
        // make sure the correct members receive this
        this.io.in(this.roomID).emit("stcPoemLines", Array.from(poemObj.lines));
    }

    reinstateContext() {
        this.sendLineEdit();
        this.sendActivity();
        this.sendLastLineStatus();
    }
}
