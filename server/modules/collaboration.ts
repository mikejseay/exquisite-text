import { randomUUID } from "node:crypto";
import { isBotUsageAuthorized } from "llm_utils/llm_funcs";
import { analyzeBeginning } from "modules/poem_bot";
import type { PoemRoom } from "modules/room";
import type { ILine, IPanel, Point, ServerToClientEvents } from "shared/types/types";
import type { TypedServer } from "types";
import { logger } from "utilities/loggerUtils";
import { getRoom } from "utilities/socketUtils";

class Collaboration {
    io: TypedServer;
    roomID: string;
    nContributions: number; // number of contributions to the artwork
    indexInGame: number; // index amongst the game's multiple Collaborations
    ID: string; // uuid assigned to this Collaboration
    mostRecentEditor: string; // deviceID (uuid)

    constructor(io: TypedServer, roomID: string, nContributions: number, indexInGame: number) {
        this.io = io;
        this.roomID = roomID;
        this.nContributions = nContributions;
        this.indexInGame = indexInGame;
        this.ID = randomUUID();
        this.mostRecentEditor = "";
    }

    protected emitToSpectators<E extends keyof ServerToClientEvents>(
        event: E,
        ...args: Parameters<ServerToClientEvents[E]>
    ): void {
        this.io.in(`${this.roomID}_Spectators`).emit(event, ...args);
    }
}

export class Poem extends Collaboration {
    // represents a single poem

    halfLine: string;
    lines: Set<ILine>;
    analysis: string;

    // any edit of lines or half-line (e.g. submitLine, handleLineEdit)
    // will send a message to the Spectators in the roomID

    constructor(io: TypedServer, roomID: string, nContributions: number, indexInGame: number) {
        super(io, roomID, nContributions, indexInGame);
        this.halfLine = "";
        this.lines = new Set<ILine>();
        this.analysis = "";
    }

    async submitLine(authorID: string, firstPart: string, secondPart: string) {
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
        this.mostRecentEditor = authorID;
        this.halfLine = secondPart;
        this.emitToSpectators("stcLineSpectator", this.indexInGame, firstPart);

        // only if we just added the very first line,
        // check if this poem's room contains any AI players. if so, analyze the poem
        if (this.lines.size !== 1) {
            return;
        }
        const room = getRoom(this.roomID) as PoemRoom;
        if (!room) {
            return;
        }
        if (!room.hasPoemBot()) {
            return;
        }
        if (!isBotUsageAuthorized(room)) {
            return;
        }
        logger.debug(`poem ${this.ID} just got its first line in a room with a PoemBot`);
        logger.debug("analyzing the poem to help the PoemBot");
        const poemStart = `${firstPart}\n${secondPart}`;
        this.analysis = await analyzeBeginning(poemStart);
        // TODO: sleep here?
    }

    sendLineEditToSpectators(value: string) {
        this.emitToSpectators("stcLineEditSpectator", this.indexInGame, value);
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

    constructor(io: TypedServer, roomID: string, nContributions: number, indexInGame: number) {
        super(io, roomID, nContributions, indexInGame);
        this.panelHint = [];
        this.panels = new Set<IPanel>();
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
        this.emitToSpectators("stcPanelSpectator", this.indexInGame, content);
    }

    sendPanelEditToSpectators(value: IPanel["content"]) {
        logger.debug(`sendPanelEditToSpectators... ${this.indexInGame} ${JSON.stringify(value)}`);
        this.emitToSpectators("stcPanelEditSpectator", this.indexInGame, value);
    }

    sendAllPanelsTo(socketID: string) {
        // this is used to bring a new spectator up to date
        this.panels.forEach((panel) => this.sendPanel(panel.content, socketID));
    }

    sendPanel(panel: IPanel["content"], socketID: string) {
        this.io.to(socketID).emit("stcPanelSpectator", this.indexInGame, panel);
    }
}
