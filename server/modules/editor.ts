import { isNil } from "es-toolkit";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid"; // a function that generates a random uuid for lines
import {
    ClientToServerEvents,
    GameState,
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
import { getEditorSocketID, getRoom, sendCollaborationContributionsInfo } from "../utilities/socketUtils";
import { DrawingRoom, PoemRoom } from "./room";
import { guaranteeHalfLineCompletion } from "./poem_bot";
import { delay, isBotUsageAuthorized } from "../llm_utils/llm_funcs";
import { logger } from "../utilities/loggerUtils";


class Editor extends Member {
    targetEditorID: string; // device ID
    turnPosition: number;
    contributionQueue: Array<Poem | Drawing>;
    isCurrentlyEditing: boolean;

    constructor(
        io: Server<ClientToServerEvents,
            ServerToClientEvents,
            InterServerEvents,
            SocketData>,
        hostSocket: Socket,
        roomID: string,
        deviceID: string,
        name: string,
    ) {
        super(io, hostSocket, roomID, deviceID, name);
        this.targetEditorID = ""; // device ID
        this.turnPosition = 0;
        this.contributionQueue = [];
        this.isCurrentlyEditing = false;
    }

    prepareForGame() {
        logger.debug(`prepareForGame in room ${this.roomID}`);
        const room = roomIDToRoom.get(this.roomID);
        if (!room) {
            logger.debug("room not found");
            return;
        }
        const editorDeviceIDs = Array.from(room.editors.keys());
        logger.debug(`editorDeviceIDs ${editorDeviceIDs}`);
        const nEditors = editorDeviceIDs.length;
        logger.debug(`nEditors ${nEditors}`);
        this.turnPosition = editorDeviceIDs.indexOf(this.deviceID);
        logger.debug(`this.turnPosition ${this.turnPosition}`);
        const safeNextIndex = (this.turnPosition + 1) % nEditors;
        logger.debug(`safeNextIndex ${safeNextIndex}`);
        this.targetEditorID = editorDeviceIDs[safeNextIndex];
        logger.debug(`this.targetEditorID ${this.targetEditorID}`);
        // this.targetEditorSocketID = room.editors.get(this.targetEditorID).socket.id;
        logger.debug(
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
            logger.debug("room not found");
            return;
        }
        room.removeEditor(this.deviceID);

        if (room.gameState === GameState.GAME) {
            // hand off any poems in your queue to the next person
            if (room.editors.size > 0) {
                const nextEditor = room.editors.get(this.targetEditorID);
                if (!nextEditor) {
                    logger.debug("nextEditor not found");
                    return;
                }
                nextEditor.contributionQueue.push(...this.contributionQueue);
                if (!nextEditor.isCurrentlyEditing) {
                    nextEditor.possibleStartNewTurn();
                }
                // trigger the room to reorganize the editors
                room.reorganizeEditors();
            } else {
                logger.debug("there are no editors left after the game started, no way to continue.");
                room.selfDestruct();
            }
        } else if (room.gameState === GameState.LOBBY) {
            // if we are still in the lobby then tell first editor to check whether they are VIP
            const firstEditor: Editor | undefined = room.editors.values().next().value;
            if (!isNil(firstEditor)) {
                firstEditor.sendSettingsEnabled();
            }
        } else if (room.gameState === GameState.END) {
            logger.debug("leaveRoom on End screen, not sure what to do...");
        }
    }

    setReceive() {
        super.setReceive();
        this.socket.on("ctsRequestEditorActive", () => this.sendActivity());
        this.socket.on("ctsStartGame", () => this.broadcastStartGame());
        this.socket.on("ctsAlterGameSettings", (value) => this.alterGameSettings(value));
    }

    unsetReceive() {
        super.unsetReceive();
        this.socket.removeAllListeners("ctsRequestEditorActive");
        this.socket.removeAllListeners("ctsStartGame");
        this.socket.removeAllListeners("ctsAlterGameSettings");
    }

    sendActivity() {
        logger.debug(this.name, "requestEditorActivity");
        this.io.to(this.socket.id).emit("stcEditorActive", this.hasWorkInQueue());
    }

    hasWorkInQueue() {
        return this.contributionQueue.length > 0;
    }

    sendSettingsEnabled() {
        logger.debug(this.name, "requestSettingsEnabled");
        this.io.to(this.socket.id).emit("stcGameSettingsEnabled", Boolean(this.isVIP()));
    }

    isVIP() {
        const room = roomIDToRoom.get(this.roomID);
        if (!room) {
            logger.debug("room not found");
            return;
        }
        return room.editors.keys().next().value === this.deviceID;
    }


    alterGameSettings(gameSettings: IGameSettingsInfo) {
        logger.debug("ctsAlterGameSettings");
        const room = getRoom(this.roomID);
        if (room) {
            room.gameSettings = gameSettings;
            this.socket.to(this.roomID).emit("stcGameSettingsInfo", gameSettings);
        }
    }

    broadcastStartGame() {
        // global in nature, so it will mainly deal with the room
        logger.debug("ctsStartGame");
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
        this.socket.on("ctsAddPoemBot", () => this.requestAddPoemBotToRoom());
    }

    unsetReceive() {
        super.unsetReceive();
        this.socket.removeAllListeners("ctsRequestLineEdit");
        this.socket.removeAllListeners("ctsEditLine");
        this.socket.removeAllListeners("ctsSendLineParts");
        this.socket.removeAllListeners("ctsSendLastLine");
        this.socket.removeAllListeners("ctsRequestLastContributionStatus");
        this.socket.removeAllListeners("ctsAddPoemBot");
    }

    broadcastStartGame() {
        // global in nature, so it will mainly deal with the room
        logger.debug("ctsStartGame");
        const room = getRoom(this.roomID) as PoemRoom;
        if (room) {
            room.setUpGame();
        }
    }

    requestAddPoemBotToRoom() {
        logger.debug("ctsAddPoemBot");
        if (this.name !== process.env.AUTHORIZED_BOT_USER_NAME) {
            logger.warn(`Unauthorized attempt to add poem bot to the room from user ${this.name}`);
            return;
        }
        const room = getRoom(this.roomID) as PoemRoom;
        if (room) {
            room.addPoemBot();
        }
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
            logger.debug("Failed to get editor socket ID");
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

        // TODO: does this fix the race condition?
        // await poemToPass.submitLine(this.deviceID, firstPart, secondPart);
        poemToPass.submitLine(this.deviceID, firstPart, secondPart);
        poemToPass.sendLineEditToSpectators(secondPart);
        if (!room) {
            logger.debug("room not found");
            return;
        }
        const nextEditor = room.editors.get(this.targetEditorID);
        if (!nextEditor) {
            logger.debug("nextEditor not found");
            return;
        }
        // Since it's not finished, put the poem into the next player's queue
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
            logger.debug(`we think the poem has ${poem.lines.size} submissions so far`);

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
            logger.debug(`we think the poem has ${currentLength} of ${poem.nContributions - 2} contributions`);
            return currentLength >= poem.nContributions - 2;
        } else {
            return false;
        }
    }

    sendLastContributionStatus() {
        logger.debug("requestLastContributionStatus");
        this.io.to(this.socket.id).emit("stcLastContribution", this.currentlyOnLastContribution());
    }

    handleLastLine(lastPart: string) {
        logger.debug(`handleLastLine in  ${this.name}`);
        // Since the poem is finished, remove it from the queue
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
            logger.debug("room not found");
            return;
        }
        room.nUnfinishedWorks--;

        // We still need to check if we need to start a new turn
        this.possibleStartNewTurn();

        // if all editors' poem queues are empty
        // remove each of the editor/spectator deviceIDs from deviceIDToRoomId
        if (room.nUnfinishedWorks === 0) {
            logger.debug("no poems left to finish; forget everyone's device, delete room and poem globals");
            room.gameState = GameState.END;
            room.sendToEnd();  // send everyone to the end screen
            room.selfDestruct();  // self-destruct after some time

            // logger.debug(`deviceIDToRoomID ${deviceIDToRoomID}`);
            // logger.debug(`roomIDToHost ${roomIDToHost}`);
            // logger.debug(`roomIDToRoom ${roomIDToRoom}`);
            // logger.debug(`room.editors ${room.editors}`);
            // logger.debug(`room.spectators ${room.spectators}`);
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
            logger.debug("room not found");
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
        sendCollaborationContributionsInfo(this);
    }
}

export class PoemBot extends PoemEditor {
    // override parent properties & methods as needed

    async possibleStartNewTurn() {
        if (this.hasWorkInQueue()) {
            // pre-determine the optimal line lengths
            const room = getRoom(this.roomID) as PoemRoom;
            if (!room) {
                return;
            }

            // do AI logic to take half Line and produce a new 1.5 lines
            const poem = this.contributionQueue[0] as Poem;

            // if the poem has exactly one line, wait 6 seconds to analyze the beginning
            // TODO: this is a dirty hack and should be fixed properly
            if (poem.lines.size === 1) {
                await delay(6000);
            }
            const halfLine = poem.halfLine;
            const forceIncomplete = halfLine.includes(".");
            logger.debug("possibleStartNewTurn invoking guaranteeHalfLineCompletion");
            if (!isBotUsageAuthorized(room)) {
                return;
            }
            const parts = await guaranteeHalfLineCompletion(
                this.deviceID,
                halfLine,
                room.gameSettings,
                forceIncomplete,
                poem.analysis,
            );
            this.handleLineParts(parts[0], parts[1]);
        }
    }
}

export class DrawingEditor extends Editor {
    setReceive() {
        super.setReceive();
        this.socket.on("ctsSendPanel", (value: Point[][]) => this.handlePanel(value));
        this.socket.on("ctsSendPanelEdit", (value: Point[][]) => this.handlePanelEdit(value));
        this.socket.on("ctsSendLastPanel", (value) => this.handleLastPanel(value));
    }

    unsetReceive() {
        super.unsetReceive();
        this.socket.removeAllListeners("ctsSendPanel");
        this.socket.removeAllListeners("ctsSendPanelEdit");
        this.socket.removeAllListeners("ctsSendLastPanel");
    }

    handlePanel(panelContent: IPanel["content"]) {
        logger.debug(`handlePanel activated with panelContent ${panelContent}`);
        // tmp to maintain testing functionality
        const room = getRoom(this.roomID) as DrawingRoom;
        room.finishedCanvas = panelContent;
        const drawingToPass = this.contributionQueue.shift() as Drawing;
        if (isNil(drawingToPass)) {
            return;
        }

        drawingToPass.submitPanel(this.deviceID, panelContent);

        if (!room) {
            logger.debug("room not found");
            return;
        }
        const nextEditor = room.editors.get(this.targetEditorID);
        if (!nextEditor) {
            logger.debug("nextEditor not found");
            return;
        }
        nextEditor.contributionQueue.push(drawingToPass);

        // trigger editors to check their queue and update their activity state
        // and view (i.e. the correct lineEdit if necessary)
        // only THIS editor should check its own queue and populate accordingly
        this.possibleStartNewTurn();
        if (!nextEditor.isCurrentlyEditing) {
            logger.debug("!nextEditor.isCurrentlyEditing");
            nextEditor.possibleStartNewTurn();
        }
    }

    handlePanelEdit(panelContent: IPanel["content"]) {
        this.lastActivity = Date.now(); // they DREW!!!! = active

        const drawing = this.contributionQueue[0] as Drawing;
        logger.debug(`handlePanelEdit: ${drawing}`);
        if (!isNil(drawing)) {
            drawing.sendPanelEditToSpectators(panelContent);
        }
    }

    possibleStartNewTurn() {
        logger.debug("in possibleStartNewTurn");
        if (this.hasWorkInQueue()) {
            logger.debug("this.hasWorkInQueue() is truthy");
            this.lastActivity = Date.now(); // give them some time to type

            const drawing = this.contributionQueue[0] as Drawing;
            if (!drawing) throw new Error("No drawings in contribution queue...");

            const latestPanel = Array.from((drawing)?.panels).pop();
            if (!latestPanel) throw new Error("All your pylons I mean panels are belong to us :(");

            this.io.to(this.socket.id).emit("stcStrokeHistory", latestPanel["content"]);
            logger.debug(`we think the drawing has ${drawing.panels.size} submissions so far`);

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
            logger.debug(`drawing.panels: ${drawing?.panels}`);
            const currentLength = drawing?.panels
                ? drawing?.panels?.size
                : 0;
            logger.debug(`we think the drawing has ${currentLength} of ${drawing.nContributions} (this should always be 3)`);
            return currentLength >= drawing.nContributions - 1;
        } else {
            return false;
        }
    }

    sendLastContributionStatus() {
        logger.debug("requestLastContributionStatus");
        this.io.to(this.socket.id).emit("stcLastContribution", this.currentlyOnLastContribution());
    }

    handleLastPanel(lastPart: IPanel["content"]) {
        logger.debug(`handleLastPanel in  ${this.name}`);
        const drawingToPass = this.contributionQueue.shift() as Drawing;
        if (isNil(drawingToPass)) {
            logger.debug("No drawing to pass");
            return;
        }
        drawingToPass.panels.add({
            ID: drawingToPass.ID,
            contributionIndex: drawingToPass.panels.size,
            content: lastPart,
            authorDevice: this.deviceID,
            passerDevice: drawingToPass.mostRecentEditor,
            hintSize: drawingToPass.panelHint.length,
            addedAt: new Date(),
        });

        // This is the last moment at which the server contains the full poem object (array of lines)
        // Most likely we should store the poem inside the room
        // So that we can pass them back to the members as needed
        this.handleDrawing(drawingToPass);

        const room = roomIDToRoom.get(this.roomID) as DrawingRoom;
        if (!room) {
            logger.debug("room not found");
            return;
        }
        room.nUnfinishedWorks--;
        // if all editors' poem queues are empty
        // remove each of the editor/spectator deviceIDs from deviceIDToRoomId
        if (room.nUnfinishedWorks === 0) {
            // broadcast completed drawings to everyone
            logger.debug("no drawings left to finish; forget everyone's device, delete room and drawing globals");
            room.sendCompletedDrawings();
            room.gameState = GameState.END;
            room.sendToEnd();  // send everyone to the end screen
            room.selfDestruct();  // self-destruct after some time

            // logger.debug(`deviceIDToRoomID ${deviceIDToRoomID}`);
            // logger.debug(`roomIDToHost ${roomIDToHost}`);
            // logger.debug(`roomIDToRoom ${roomIDToRoom}`);
            // logger.debug(`room.editors ${room.editors}`);
            // logger.debug(`room.spectators ${room.spectators}`);
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
            logger.debug("room not found");
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
        sendCollaborationContributionsInfo(this);
    }
}
