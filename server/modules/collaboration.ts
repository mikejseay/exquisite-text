import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid"; // a function that generates a random uuid for lines

import {
    ClientToServerEvents,
    ILine,
    InterServerEvents, Point,
    ServerToClientEvents,
    SocketData,
} from "../../src/types";
import { storeLine } from "../queries";

// TODO: create specialized classes for Drawing
// Classes to create: Drawing, DrawingRoom, DrawingSpectator, DrawingEditor
// Move parasitic functions for canvas test into new classes
// Implement some UI element to create DrawingRoom rather than PoemRoom
// Modify modules/sockets.ts to handle user wanting to join a Drawing Room as editor/spectator
// Finish front-end components for Canvas analogous to Poem stuff, starting with Canvas / CanvasSpectator screens

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
            lineIndex: this.lines.size,
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
