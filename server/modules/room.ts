import { Server, Socket } from "socket.io";
import { io as ioClient } from "socket.io-client";

import {
    botDeviceIDToBotSocket,
    deviceIDToRoomID,
    deviceIDToSocketID,
    roomIDToHost,
    roomIDToRoom,
    socketIDToDeviceID,
} from "./globals";
import { DrawingSpectator, PoemSpectator } from "./spectator";
import type { DrawingEditor, PoemEditor } from "./editor";
import { PoemBot } from "./editor";
import Member from "./member";
import { Drawing, Poem } from "./collaboration";
import {
    ClientToServerEvents,
    GameState,
    IGameSettingsInfo,
    IUserTableInfo,
    InterServerEvents,
    Medium,
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
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utilities/loggerUtils";

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
const serverPath: URL["pathname"] | URL["href"] = isDevelopment
    ? "http://localhost:3000"
    : "/";
logger.debug({ serverPath }, "in room.ts");

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

    editors: Map<string, PoemEditor | DrawingEditor>;
    spectators: Map<string, PoemSpectator | DrawingSpectator>;
    gameState: GameState;
    nUnfinishedWorks: number;
    activityInterval: ReturnType<typeof setInterval>;
    createdAt: number;
    // poem-specific for now until we figure out how to type generally
    gameSettings: IGameSettingsInfo;
    finishedWorks: Array<Poem | Drawing>;
    medium: Medium;

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
        this.gameState = GameState.LOBBY; // initialize in Lobby
        this.nUnfinishedWorks = 0;

        // check user activity every 30 seconds
        this.activityInterval = setInterval(
            this.checkActivity.bind(this),
            checkActivityInterval,
        );
        this.createdAt = Date.now();
        this.gameSettings = defaultGameSettings;
        this.finishedWorks = [];
        this.medium = Medium.ART;
    }

    addEditor(deviceUUID: string, editorObj: PoemEditor | DrawingEditor) {
        logger.debug(`addEditor with deviceUUID ${deviceUUID}`);
        this.editors.set(deviceUUID, editorObj);
        this.sendCurrentUserTableInfo(); // give the room updated user info
    }

    removeEditor(deviceUUID: string) {
        logger.debug(`removeEditor with deviceUUID ${deviceUUID}`);
        this.editors.delete(deviceUUID);
        this.sendCurrentUserTableInfo(); // give the room updated user info
    }

    addSpectator(deviceUUID: string, spectatorObj: PoemSpectator | DrawingSpectator) {
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
        for (const editor of this.editors.values()) {
            editorNames.push(editor.name);
            editorColors.push(editorColorDefaultsArr[editorIndex]);
            editorColorMap[editor.deviceID] = editorColorDefaultsArr[editorIndex];
            editorIndex++;
        }
        for (const spectator of this.spectators.values()) {
            spectatorNames.push(spectator.name);
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
        for (const editor of this.editors.values()) {
            editor.prepareForGame();
        }
    }

    checkActivity() {
        const currentTime = Date.now();
        logger.debug(this.roomID, "checking activity at", currentTime);
        if (
            this.editors.size === 0 &&
            this.spectators.size === 0 &&
            currentTime - this.createdAt > maxRoomTimeSpentEmpty
        ) {
            logger.debug(this.roomID, "spent too long with no members, destroying");
            this.selfDestruct();
            return;
        }
        for (const spectator of this.spectators.values()) {
            if (
                !spectator.connected &&
                currentTime - spectator.lastActivity > maxMemberTimeSpentInactive
            ) {
                spectator.leaveRoom();
                logger.debug(`booting ${spectator.name} based on inactivity`);
            }
        }
        for (const editor of this.editors.values()) {
            if (
                editor.isCurrentlyEditing &&
                currentTime - editor.lastActivity > maxMemberTimeSpentInactive
            ) {
                editor.leaveRoom();
                logger.debug(`booting ${editor.name} based on inactivity`);
            }
        }
    }

    sendToEnd() {
        logger.debug(this.roomID, "sending everyone to the end screen");
        this.io.in(this.roomID).emit("stcNavigate", "/end");
    }

    async selfDestruct() {
        logger.debug(this.roomID, "will self-destruct in 100 seconds");
        await sleep(100_000);
        logger.debug(this.roomID, "self-destructing");

        for (const [ editorID, editor ] of this.editors.entries()) {
            this.cleanUpMember(editorID, editor);
            this.editors.delete(editorID);
        }
        for (const [ spectatorID, spectator ] of this.spectators.entries()) {
            this.cleanUpMember(spectatorID, spectator);
            this.spectators.delete(spectatorID);
        }

        clearInterval(this.activityInterval);
        roomIDToHost.delete(this.roomID);
        roomIDToRoom.delete(this.roomID);
    }

    cleanUpMember(deviceID: string, member: Member) {
        delete deviceIDToRoomID[deviceID];
        member.connected = false;
        member.socket.leave(member.roomID);
        member.unsetReceive();
        delete socketIDToDeviceID[member.socket.id];
        delete deviceIDToSocketID[deviceID];
    }

    navigateMembersToGame() {
        // should tell editors to navigate to /game and spectators to /spectate
        this.gameState = GameState.GAME;
        this.io.in(`${this.roomID}_Editors`).emit("stcNavigate", "/game");
        this.io.in(`${this.roomID}_Spectators`).emit("stcNavigate", "/spectate");

        for (const editor of this.editors.values()) {
            editor.sendActivity();
            editor.sendLastContributionStatus();
        }
    }
}

export class PoemRoom extends Room {
    constructor(
        io: Server<ClientToServerEvents,
            ServerToClientEvents,
            InterServerEvents,
            SocketData>,
        hostSocket: Socket,
        room: string,
    ) {
        super(io, hostSocket, room);
        this.medium = Medium.POETRY;
    }

    storePoem(poemObj: Poem) {
        logger.debug(this.roomID, "storing poem", poemObj.ID);
        this.finishedWorks.push(poemObj);
    }

    setUpGame() {
        logger.debug(`setUpGame with this.editors ${this.editors}`);
        const nContributions = this.gameSettings["nRounds"] * this.editors.size + 2;

        // have each editor set their important properties
        let nPoemsToHandOut = this.gameSettings["nPoems"];
        this.nUnfinishedWorks = nPoemsToHandOut;
        let poemIndex = 0;
        // prepare each player for the game
        for (const editor of this.editors.values()) {
            editor.lastActivity = Date.now(); // refresh AFK timers upon game start
            editor.prepareForGame();
        }
        // as long as there are poems, cycle through editors, giving one to each
        while (nPoemsToHandOut > 0) {
            for (const editor of this.editors.values()) {
                const poem = new Poem(this.io, this.roomID, nContributions, poemIndex); // creates Poem object
                editor.contributionQueue.push(poem);
                editor.isCurrentlyEditing = true;
                nPoemsToHandOut--;
                poemIndex++;

                if (nPoemsToHandOut <= 0) {
                    break;
                }
            }
        }

        this.navigateMembersToGame();
    }

    addPoemBot() {
        // the approach we take here is to spoof a client socket from here on the server
        // we use a special top-level socket message to get them to join as a bot

        logger.debug(`room trying to add PoemBot with server path ${serverPath}`);
        const botDeviceID = uuidv4();
        const botSocket = ioClient(serverPath);
        botDeviceIDToBotSocket.set(botDeviceID, botSocket);
        botSocket.emit("ctsJoinAsBot", this.roomID, "BOT", botDeviceID);

    }

    hasPoemBot() {
        for (const value of this.editors.values()) {
            if (value instanceof PoemBot) {
                return true;
            }
        }
        return false;
    }
}

export class DrawingRoom extends Room {
    finishedCanvas: Point[][]; // from testing, probably unused

    constructor(
        io: Server<ClientToServerEvents,
            ServerToClientEvents,
            InterServerEvents,
            SocketData>,
        hostSocket: Socket,
        room: string,
    ) {
        super(io, hostSocket, room);
        this.finishedCanvas = [];
        this.medium = Medium.DRAWING;
    }

    setUpGame() {
        logger.debug(`setUpGame with this.editors ${this.editors}`);
        const nContributions = 3;

        // have each editor set their important properties
        let nDrawingsToHandOut = this.gameSettings["nDrawings"];
        this.nUnfinishedWorks = nDrawingsToHandOut;
        let drawingIndex = 0;

        for (const editor of this.editors.values()) {
            editor.lastActivity = Date.now(); // refresh AFK timers upon game start
            editor.prepareForGame();

            // give the editor a new drawing
            if (nDrawingsToHandOut > 0) {
                const drawing = new Drawing(this.io, this.roomID, nContributions, drawingIndex); // creates Poem object
                editor.contributionQueue.push(drawing);
                editor.isCurrentlyEditing = true;
                nDrawingsToHandOut--;
                drawingIndex++;
            }
        }

        this.navigateMembersToGame();
    }

    storeDrawing(drawingObj: Drawing) {
        logger.debug(this.roomID, "storing drawing", drawingObj.ID);
        this.finishedWorks.push(drawingObj);
    }

    //     ROOM:
    //     this.panels = new Set<IPanel>;
    // }
    // export interface IPanel extends IContribution {
    //     content: Point[][];
    //     hintSize: number;
    // }
    // this.finishedWorks is an array of Drawing. drawing.panels is Set<IPanel>
    // on IPanel, content is Point[][]
    sendCompletedDrawings() {
        logger.debug("sendCompletedDrawings ;))))))))))");
        const iPanels = Array.from(this.finishedWorks as Drawing[]).map((drawing) => Array.from(drawing?.panels));
        const completedDrawings = Array.from(iPanels).map((iPanel) => iPanel.map(panel => panel?.content));

        this.io.in(this.roomID).emit("stcCompletedDrawings", completedDrawings);
    }
}
