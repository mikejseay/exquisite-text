import isNil from "lodash/isNil";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid"; // a function that generates a random uuid for lines
import {
    ClientToServerEvents,
    GameState,
    IDrawing,
    IGameSettingsInfo,
    IPanel,
    IPoem,
    InterServerEvents,
    Point,
    ServerToClientEvents,
    SocketData,
} from "../../src/types";
import { storePoem } from "../queries";
import { lineSepString } from "../../src/constants";

import { roomIDToRoom } from "./globals";
import type { Drawing, Poem } from "./collaboration";
import Member from "./member";
import { getEditorSocketID, getRoom, sendCollaborationContributionsInfo } from "../utilities/sockets";
import { DrawingRoom, PoemRoom } from "./room";

class Editor extends Member {
    targetEditorID: string;
    turnPosition: number;
    contributionQueue: Array<Poem | Drawing>;
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
        const room = roomIDToRoom.get(this.roomID);
        if (!room) {
            console.log("room not found");
            return;
        }
        const editorDeviceIDs = Array.from(room.editors.keys());
        console.log("editorDeviceIDs", editorDeviceIDs);
        const nEditors = editorDeviceIDs.length;
        console.log("nEditors", nEditors);
        this.turnPosition = editorDeviceIDs.indexOf(this.deviceID);
        console.log("this.turnPosition", this.turnPosition);
        const safeNextIndex = (this.turnPosition + 1) % nEditors;
        console.log("safeNextIndex", safeNextIndex);
        this.targetEditorID = editorDeviceIDs[safeNextIndex];
        console.log("this.targetEditorID", this.targetEditorID);
        // this.targetEditorSocketID = room.editors.get(this.targetEditorID).socket.id;
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
        const room = getRoom(this.roomID);
        if (!room) {
            console.log("room not found");
            return;
        }
        room.removeEditor(this.deviceID);

        if (room.gameState === GameState.GAME) {
            // hand off any poems in your queue to the next person
            if (room.editors.size > 0) {
                const nextEditor = room.editors.get(this.targetEditorID);
                if (!nextEditor) {
                    console.log("nextEditor not found");
                    return;
                }
                nextEditor.contributionQueue.push(...this.contributionQueue);
                if (!nextEditor.isCurrentlyEditing) {
                    nextEditor.possibleStartNewTurn();
                }
                // trigger the room to reorganize the editors
                room.reorganizeEditors();
            } else {
                console.log(
                    "there are no editors left after the game started, no way to continue.",
                );
                room.selfDestruct();
            }
        } else if (room.gameState === GameState.LOBBY) {
            // if we are still in the lobby then tell first editor to check whether they are VIP
            const firstEditor: Editor | undefined = room.editors.values().next().value;
            if (!isNil(firstEditor)) {
                firstEditor.sendSettingsEnabled();
            }
        } else if (room.gameState === GameState.END) {
            console.log("leaveRoom on End screen, not sure what to do...");
        }
    }

    setReceive() {
        super.setReceive();
        this.socket.on("ctsRequestEditorActive", () => this.sendActivity());
        this.socket.on("ctsStartGame", () => this.broadcastStartGame());
    }

    unsetReceive() {
        super.unsetReceive();
        this.socket.removeAllListeners("ctsRequestEditorActive");
        this.socket.removeAllListeners("ctsStartGame");
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
        const room = roomIDToRoom.get(this.roomID);
        if (!room) {
            console.log("room not found");
            return;
        }
        return room.editors.keys().next().value === this.deviceID;
    }


    alterGameSettings(gameSettings: IGameSettingsInfo) {
        console.log("ctsAlterGameSettings");
        const room = getRoom(this.roomID);
        if (room) {
            room.gameSettings = gameSettings;
            this.socket.to(this.roomID).emit("stcGameSettingsInfo", gameSettings);
        }
    }

    broadcastStartGame() {
        // global in nature, so it will mainly deal with the room
        console.log("ctsStartGame");
        const room = getRoom(this.roomID);
        if (room) {
            room.setUpGame();
        }
    }
}

export class PoemEditor extends Editor {

    setReceive() {
        super.setReceive();
        this.socket.on("ctsRequestLineEdit", () => this.sendLineEdit()); // initial populate
        this.socket.on("ctsEditLine", (value) => this.handleLineEdit(value)); // whenever the input box is edited.
        this.socket.on("ctsSendLineParts", (firstPart, secondPart) =>
            this.handleLineParts(firstPart, secondPart),
        );
        this.socket.on("ctsSendLastLine", (value) => this.handleLastLine(value)); // whenever a new line has been submitted into the poem.
        this.socket.on("ctsRequestLastContributionStatus", () => this.sendLastContributionStatus());
        this.socket.on("ctsAlterGameSettings", (value) =>
            this.alterGameSettings(value),
        );
    }

    unsetReceive() {
        super.unsetReceive();
        this.socket.removeAllListeners("ctsRequestLineEdit");
        this.socket.removeAllListeners("ctsEditLine");
        this.socket.removeAllListeners("ctsSendLineParts");
        this.socket.removeAllListeners("ctsSendLastLine");
        this.socket.removeAllListeners("ctsRequestLastContributionStatus");
        this.socket.removeAllListeners("ctsAlterGameSettings");
    }

    sendLineEdit() {
        // this is activated when the game view initially loads
        // this should fill in what it's supposed to based on
        // the halfLine of the first Poem in the queue (if this editor is active)

        if (this.hasWorkInQueue()) {
            this.io.to(this.socket.id).emit("stcLineEdit", (this.contributionQueue[0] as Poem)?.halfLine);
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
        const poem = this.contributionQueue[0] as Poem;
        if (!isNil(poem)) {
            poem.sendLineEditToSpectators(value);
        }
    }

    handleLineParts(firstPart: string, secondPart: string) {
        const room = getRoom(this.roomID) as PoemRoom;
        const poemToPass = this.contributionQueue.shift() as Poem;
        if (isNil(poemToPass)) {
            return;
        }

        poemToPass.submitLine(this.deviceID, firstPart, secondPart);
        poemToPass.sendLineEditToSpectators(secondPart);
        if (!room) {
            console.log("room not found");
            return;
        }
        const nextEditor = room.editors.get(this.targetEditorID);
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
            this.io.to(this.socket.id).emit("stcLineEdit", (this.contributionQueue[0] as Poem).halfLine);
            const poem = this.contributionQueue[0] as Poem;
            console.log(
                "we think the poem has",
                poem.lines.size,
                "submissions so far",
            );

            if (poem.lines.size === poem.nContributions - 2) {
                this.io.to(this.socket.id).emit("stcLastContribution", true);
            } else {
                this.io.to(this.socket.id).emit("stcLastContribution", false);
            }
            this.io.to(this.socket.id).emit("stcEditorActive", true);
            this.isCurrentlyEditing = true;
        } else {
            this.io.to(this.socket.id).emit("stcLineEdit", "");
            this.io.to(this.socket.id).emit("stcEditorActive", false);
            this.isCurrentlyEditing = false;
        } // otherwise, leave it the way it was?
    }

    currentlyOnLastContribution() {
        const poem = this.contributionQueue[0] as Poem;
        if (poem) {
            const currentLength = poem.lines.size;
            console.log(
                "we think the poem has ",
                currentLength,
                "of",
                poem.nContributions - 2,
            );
            return currentLength >= poem.nContributions - 2;
        } else {
            return false;
        }
    }

    sendLastContributionStatus() {
        console.log("requestLastContributionStatus");
        this.io.to(this.socket.id).emit("stcLastContribution", this.currentlyOnLastContribution());
    }

    handleLastLine(lastPart: string) {
        console.log("handleLastLine in ", this.name);
        const poemToPass = this.contributionQueue.shift() as Poem;
        if (isNil(poemToPass)) {
            return;
        }
        poemToPass.lines.add({
            ID: poemToPass.ID,
            contributionIndex: poemToPass.lines.size,
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

        const room = roomIDToRoom.get(this.roomID);
        if (!room) {
            console.log("room not found");
            return;
        }
        room.nUnfinishedWorks--;
        // if all editors' poem queues are empty
        // remove each of the editor/spectator deviceIDs from deviceIDToRoomId
        if (room.nUnfinishedWorks === 0) {
            console.log(
                "no poems left to finish; forget everyone's device, delete room and poem globals",
            );
            room.gameState = GameState.END;
            room.sendToEnd();  // send everyone to the end screen
            room.selfDestruct();  // self-destruct after some time

            // console.log("deviceIDToRoomID", deviceIDToRoomID);
            // console.log("roomIDToHost", roomIDToHost);
            // console.log("roomIDToRoom", roomIDToRoom);
            // console.log("room.editors", room.editors);
            // console.log("room.spectators", room.spectators);
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
        const room = getRoom(this.roomID) as PoemRoom;
        if (!room) {
            console.log("room not found");
            return;
        }
        room.storePoem(poemObj);

    }

    sendPoemAsLines(poemObj: Poem) {
        // crucial method that sends the poem to all users
        // make sure the correct members receive this
        this.io.in(this.roomID).emit("stcPoemLines", Array.from(poemObj.lines));
    }

    reinstateContext() {
        super.reinstateContext();
        this.sendLineEdit();
        this.sendActivity();
        this.sendLastContributionStatus();
        sendCollaborationContributionsInfo(this, false);
    }
}

export class DrawingEditor extends Editor {
    setReceive() {
        super.setReceive();
        this.socket.on("ctsSendPanel", (value: Point[][]) => this.handlePanel(value));
        this.socket.on("ctsSendLastPanel", (value) => this.handleLastPanel(value));
        this.socket.on("ctsRequestLastContributionStatus", () => this.sendLastContributionStatus());
        this.socket.on("ctsAlterGameSettings", (value) =>
            this.alterGameSettings(value),
        );
    }

    unsetReceive() {
        super.unsetReceive();
        this.socket.removeAllListeners("ctsSendPanel");
        this.socket.removeAllListeners("ctsAlterGameSettings");
    }

    handlePanel(panelContent: IPanel["content"]) {
        console.log("handlePanel activated with panelContent", panelContent);
        // tmp to maintain testing functionality
        const room = getRoom(this.roomID) as DrawingRoom;
        room.finishedCanvas = panelContent;
        // TODO: make contributionQueue work for Drawings
        const drawingToPass = this.contributionQueue.shift() as Drawing;
        if (isNil(drawingToPass)) {
            return;
        }

        drawingToPass.submitPanel(this.deviceID, panelContent);

        if (!room) {
            console.log("room not found");
            return;
        }
        const nextEditor = room.editors.get(this.targetEditorID);
        if (!nextEditor) {
            console.log("nextEditor not found");
            return;
        }
        nextEditor.contributionQueue.push(drawingToPass);

        // trigger editors to check their queue and update their activity state
        // and view (i.e. the correct lineEdit if necessary)
        // only THIS editor should check its own queue and populate accordingly
        this.possibleStartNewTurn();
        if (!nextEditor.isCurrentlyEditing) {
            console.log("!nextEditor.isCurrentlyEditing");
            nextEditor.possibleStartNewTurn();
        }
    }

    possibleStartNewTurn() {
        console.log("in possibleStartNewTurn");
        if (this.hasWorkInQueue()) {
            console.log("this.hasWorkInQueue() is truthy");
            this.lastActivity = Date.now(); // give them some time to type

            const drawing = this.contributionQueue[0] as Drawing;
            if (!drawing) throw new Error("No drawings in contribution queue...");

            const latestPanel = Array.from((drawing)?.panels).pop();
            if (!latestPanel) throw new Error("All your pylons I mean panels are belong to us :(");

            this.io.to(this.socket.id).emit("stcStrokeHistory", latestPanel["content"]);
            console.log(
                "we think the drawing has",
                drawing.panels.size,
                "submissions so far",
            );

            if (drawing.panels.size === drawing.nContributions - 1) {
                this.io.to(this.socket.id).emit("stcLastContribution", true);
            } else {
                this.io.to(this.socket.id).emit("stcLastContribution", false);
            }
            this.io.to(this.socket.id).emit("stcEditorActive", true);
            this.isCurrentlyEditing = true;
        } else {
            this.io.to(this.socket.id).emit("stcEditorActive", false);
            this.isCurrentlyEditing = false;
        } // otherwise, leave it the way it was?
    }

    currentlyOnLastContribution() {
        const drawing = this.contributionQueue[0] as Drawing;
        if (drawing) {
            console.log({ drawing });
            console.log("drawing.panels:", drawing?.panels);
            const currentLength = drawing?.panels
                ? drawing?.panels?.size
                : 0;
            console.log(
                "we think the drawing has ",
                currentLength,
                "of",
                drawing.nContributions,
                "(this should always be 3)",
            );
            return currentLength >= drawing.nContributions - 1;
        } else {
            return false;
        }
    }

    sendLastContributionStatus() {
        console.log("requestLastContributionStatus");
        this.io.to(this.socket.id).emit("stcLastContribution", this.currentlyOnLastContribution());
    }

    handleLastPanel(lastPart: IPanel["content"]) {
        console.log("handleLastPanel in ", this.name);
        const drawingToPass = this.contributionQueue.shift() as Drawing;
        if (isNil(drawingToPass)) {
            console.log("No drawing to pass");
            return;
        }
        drawingToPass.panels.add({
            ID: drawingToPass.ID,
            contributionIndex: drawingToPass.panels.size,
            content: lastPart,
            authorDevice: this.deviceID,
            passerDevice: drawingToPass.mostRecentEditor, // previous editor, starts at ""
            hintSize: drawingToPass.panelHint.length,
            addedAt: new Date(),
        });

        // This is the last moment at which the server contains the full poem object (array of lines)
        // Most likely we should store the poem inside the room
        // So that we can pass them back to the members as needed
        this.handleDrawing(drawingToPass);

        const room = roomIDToRoom.get(this.roomID);
        if (!room) {
            console.log("room not found");
            return;
        }
        room.nUnfinishedWorks--;
        // if all editors' poem queues are empty
        // remove each of the editor/spectator deviceIDs from deviceIDToRoomId
        if (room.nUnfinishedWorks === 0) {
            console.log(
                "no drawings left to finish; forget everyone's device, delete room and poem globals",
            );
            room.gameState = GameState.END;
            room.sendToEnd();  // send everyone to the end screen
            room.selfDestruct();  // self-destruct after some time

            // console.log("deviceIDToRoomID", deviceIDToRoomID);
            // console.log("roomIDToHost", roomIDToHost);
            // console.log("roomIDToRoom", roomIDToRoom);
            // console.log("room.editors", room.editors);
            // console.log("room.spectators", room.spectators);
        }
    }

    handleDrawing(drawingObj: Drawing) {
        // if (process.env.IS_LIBRARY_ENABLED === "true") {
        //     const drawingArray = Array.from(drawingObj.panels).flatMap(x => x?.content);
        //     const drawing: IDrawing = {
        //         content: drawingArray,
        //         createdAt: new Date(),
        //         id: uuidv4(),
        //         title: `exquisite text #${Math.round(Math.random() * 100)}`,
        //     };

        //     // add the drawing to the database
        //     // NOTE: Does not exist yet
        //     storeDrawing(drawing);
        // }

        this.sendDrawingAsPanels(drawingObj);

        // save the drawing into the Room object
        const room = getRoom(this.roomID) as DrawingRoom;
        if (!room) {
            console.log("room not found");
            return;
        }
        room.storeDrawing(drawingObj);
    }

    sendDrawingAsPanels(drawingObj: Drawing) {
        // crucial method that sends the drawing to all users
        // make sure the correct members receive this
        this.io.in(this.roomID).emit("stcDrawingPanels", Array.from(drawingObj.panels));
    }

    reinstateContext() {
        super.reinstateContext();
        this.sendActivity();
        this.sendLastContributionStatus();
        sendCollaborationContributionsInfo(this, false);
    }
}
