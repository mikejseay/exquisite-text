import { Server } from "socket.io";
import * as dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid"; // a function that generates a random uuid for lines
import {
    ClientToServerEvents,
    ILine,
    IPanel,
    InterServerEvents,
    Point,
    ServerToClientEvents,
    SocketData,
} from "../../src/types";
import { storeLine } from "../queries";
import { logger } from "../utilities/loggerUtils";

dotenv.config({ path: __dirname + "/../.env" });

console.log(process.env);
class Collaboration {
    io: Server<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
    >;
    roomID: string;
    nContributions: number; // number of contributions to the artwork
    indexInGame: number; // index amongst the game's multiple Collaborations
    ID: string; // uuid assigned to this Collaboration
    mostRecentEditor: string; // deviceID (uuid)

    constructor(
        io: Server<
            ClientToServerEvents,
            ServerToClientEvents,
            InterServerEvents,
            SocketData
        >,
        roomID: string,
        nContributions: number,
        indexInGame: number,
    ) {
        this.io = io;
        this.roomID = roomID;
        this.nContributions = nContributions;
        this.indexInGame = indexInGame;
        this.ID = uuidv4();
        this.mostRecentEditor = "";
    }
}

export class Poem extends Collaboration {
    // represents a single poem

    halfLine: string;
    lines: Set<ILine>;

    // any edit of lines or half-line (e.g. submitLine, handleLineEdit)
    // will send a message to the Spectators in the roomID

    constructor(

        io: Server<
            ClientToServerEvents,
            ServerToClientEvents,
            InterServerEvents,
            SocketData
        >,
        roomID: string,
        nContributions: number,
        indexInGame: number,
    ) {
        super(io, roomID, nContributions, indexInGame);
        this.halfLine = "";
        this.lines = new Set<ILine>();
    }

    submitLine(authorID: string, firstPart: string, secondPart: string) {
        const myLine = {
            ID: this.ID,
            contributionIndex: this.lines.size,
            content: firstPart,
            authorDevice: authorID,
            passerDevice: this.mostRecentEditor, // previous editor, starts at ""
            editLength: this.halfLine.length, // previous line length, starts at 0
            addedAt: new Date(),
        };
        this.lines.add(myLine);
        if (process.env.IS_LIBRARY_ENABLED === "true") {
            storeLine(myLine);
        }
        this.mostRecentEditor = authorID;
        this.halfLine = secondPart;
        this.io
            .in(`${this.roomID}_Spectators`)
            .emit("stcLineSpectator", this.indexInGame, firstPart);
    }

    sendLineEditToSpectators(value: string) {
        this.io
            .in(`${this.roomID}_Spectators`)
            .emit("stcLineEditSpectator", this.indexInGame, value);
    }

    sendAllLinesTo(socketID: string) {
    // this is used to bring a new spectator up to date
        this.lines.forEach((line) => this.sendLine(line.content, socketID));
    }

    sendLine(line: string, socketID: string) {
        this.io.to(socketID).emit("stcLineSpectator", this.indexInGame, line);
    }
}

export class Drawing extends Collaboration {
    // represents a single drawing

    panelHint: Point[][];
    panels: Set<IPanel>;

    constructor(
        io: Server<
            ClientToServerEvents,
            ServerToClientEvents,
            InterServerEvents,
            SocketData
        >,
        roomID: string,
        nContributions: number,
        indexInGame: number,
    ) {
        super(io, roomID, nContributions, indexInGame);
        this.panelHint = [];
        this.panels = new Set<IPanel>;
    }

    submitPanel(authorID: string, content: Point[][]) {
        const panel = {
            ID: this.ID,
            contributionIndex: this.panels.size,
            content: content,
            authorDevice: authorID,
            passerDevice: this.mostRecentEditor, // previous editor, starts at ""
            hintSize: this.panelHint.length, // previous line length, starts at 0
            addedAt: new Date(),
        };
        this.panels.add(panel);

        this.mostRecentEditor = authorID;
        this.panelHint = []; // reset the hint
        // Emit the stroke history (which is the panel content) to all Spectators
        this.io
            .in(`${this.roomID}_Spectators`)
            .emit("stcPanelSpectator", this.indexInGame, content);
    }

    sendPanelEditToSpectators(value: IPanel["content"]) {
        logger.debug("sendPanelEditToSpectators...", this.indexInGame, value);
        this.io
            .in(`${this.roomID}_Spectators`)
            .emit("stcPanelEditSpectator", this.indexInGame, value);
    }

    sendAllPanelsTo(socketID: string) {
    // this is used to bring a new spectator up to date
        this.panels.forEach((panel) => this.sendPanel(panel.content, socketID));
    }

    sendPanel(panel: IPanel["content"], socketID: string) {
        this.io.to(socketID).emit("stcPanelSpectator", this.indexInGame, panel);
    }
}
