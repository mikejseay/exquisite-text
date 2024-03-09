import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid"; // a function that generates a random uuid for lines

import {
    ClientToServerEvents,
    ILine,
    InterServerEvents,
    ServerToClientEvents,
    SocketData,
} from "../../src/types";
import { storeLine } from "../queries";

class Poem {
    // represents a single poem

    targetLines: number;
    poemIndex: number;
    io: Server<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
    >;
    roomId: string;
    poemID: string;
    halfLine: string;
    mostRecentEditor: string;
    lines: Set<ILine>;

    // any edit of lines or half-line (e.g. submitLine, handleLineEdit)
    // will send a message to the Spectators in the roomId

    constructor(
        targetLines: number,
        poemIndex: number,
        io: Server<
            ClientToServerEvents,
            ServerToClientEvents,
            InterServerEvents,
            SocketData
        >,
        roomId: string,
    ) {
        this.targetLines = targetLines;
        this.poemIndex = poemIndex;
        this.io = io;
        this.roomId = roomId;
        this.poemID = uuidv4();
        this.halfLine = "";
        this.mostRecentEditor = "";
        this.lines = new Set<ILine>();
    }

    submitLine(authorID: string, firstPart: string, secondPart: string) {
        const myLine = {
            poemID: this.poemID,
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
            .in(`${this.roomId}_Spectators`)
            .emit("stcLineSpectator", this.poemIndex, firstPart);
    }

    sendLineEditToSpectators(value: string) {
        this.io
            .in(`${this.roomId}_Spectators`)
            .emit("stcLineEditSpectator", this.poemIndex, value);
    }

    sendAllLinesTo(socketID: string) {
    // this is used to bring a new spectator up to date
        this.lines.forEach((line) => this.sendLine(line.content, socketID));
    }

    sendLine(line: string, socketID: string) {
        this.io.to(socketID).emit("stcLineSpectator", this.poemIndex, line);
    }
}

export default Poem;
