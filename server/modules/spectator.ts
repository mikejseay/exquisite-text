import { roomIDToRoom } from "./globals";
import Member from "./member";
import { getRoom, sendCollaborationContributionsInfo } from "../utilities/socketUtils";
import type { DrawingRoom, PoemRoom } from "./room";
import type { Poem } from "./collaboration";
import { logger } from "../utilities/loggerUtils";

class Spectator extends Member {
    joinRoom() {
        super.joinRoom();
        this.socket.join(`${this.roomID}_Spectators`);
    }

    leaveRoom() {
        super.leaveRoom();
        this.socket.leave(`${this.roomID}_Spectators`);
        const room = getRoom(this.roomID);
        if (!room) {
            logger.debug("room not found");
            return;
        }
        room.removeSpectator(this.deviceID);
    }

    disconnect() {
        this.lastActivity = Date.now(); // refresh activity
        super.disconnect();
    }
}

export class PoemSpectator extends Spectator {
    sendAllPoemLines() {
        const room = roomIDToRoom.get(this.roomID) as PoemRoom;
        if (!room) {
            logger.debug("room not found");
            return;
        }
        for (const editor of room.editors.values()) {
            for (const poem of editor.contributionQueue) {
                (poem as Poem).sendAllLinesTo(this.socket.id);
            }
        }
    }

    reinstateContext() {
        // TODO: Placeholder
        super.reinstateContext();
        this.sendAllPoemLines(); // sends poems that are in progress
        sendCollaborationContributionsInfo(this); // sends completed poems for end of game
    }
}

export class DrawingSpectator extends Spectator {
    setReceive() {
        super.setReceive();
        this.listen("ctsRequestCanvas", () => this.sendCanvas());
    }

    sendCanvas() {
        const room = getRoom(this.roomID) as DrawingRoom;
        logger.debug(`sendCanvas activated by room ${this.roomID}`);
        if (!room) {
            logger.debug("room not found");
            return;
        }
        const canvas = room.finishedCanvas;
        logger.debug(`sendCanvas activated sending ${canvas}`);
        this.emitToSelf("stcStrokeHistory", canvas);
    }
}
