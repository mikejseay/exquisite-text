import { roomIDToRoom } from "./globals";
import Member from "./member";
import { getRoom, sendCollaborationContributionsInfo } from "../utilities/sockets";
import type { DrawingRoom, PoemRoom } from "./room";
import type { Poem } from "./collaboration";

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
            console.log("room not found");
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
            console.log("room not found");
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
        this.socket.on("ctsRequestCanvas", () => this.sendCanvas());
    }

    unsetReceive() {
        super.unsetReceive();
        this.socket.removeAllListeners("ctsRequestCanvas");
    }

    sendCanvas() {
        const room = getRoom(this.roomID) as DrawingRoom;
        console.log("sendCanvas activated by room", this.roomID);
        if (!room) {
            console.log("room not found");
            return;
        }
        const canvas = room.finishedCanvas;
        console.log("sendCanvas activated sending", canvas);
        // for (const editor of room.editors.values()) {
        // }
        this.io
            .to(this.socket.id)
            .emit("stcStrokeHistory", canvas);
    }
}
