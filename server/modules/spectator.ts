import { roomIDToRoom } from "./globals";
import Member from "./member";

class Spectator extends Member {
    joinRoom() {
        super.joinRoom();
        this.socket.join(`${this.roomID}_Spectators`);
    }

    leaveRoom() {
        super.leaveRoom();
        this.socket.leave(`${this.roomID}_Spectators`);
        const thisRoom = roomIDToRoom.get(this.roomID);
        if (!thisRoom) {
            console.log("thisRoom not found");
            return;
        }
        thisRoom.removeSpectator(this.deviceID);
    }

    disconnect() {
        this.lastActivity = Date.now(); // refresh activity
        super.disconnect();
    }
}

class PoemSpectator extends Spectator {
    setReceive() {
        super.setReceive();
        this.socket.on("ctsRequestCanvas", () => this.sendCanvas());
    }

    unsetReceive() {
        super.unsetReceive();
        this.socket.removeAllListeners("ctsRequestCanvas");
    }

    sendCanvas() {
        const thisRoom = roomIDToRoom.get(this.roomID);
        if (!thisRoom) {
            console.log("thisRoom not found");
            return;
        }
        const canvas = thisRoom.finishedCanvas;
        // for (const thisEditor of thisRoom.editors.values()) {
        // }
        this.io
            .to(this.socket.id)
            .emit("stcStrokeHistory", canvas);
    }

    sendAllPoemLines() {
        const thisRoom = roomIDToRoom.get(this.roomID);
        if (!thisRoom) {
            console.log("thisRoom not found");
            return;
        }
        for (const thisEditor of thisRoom.editors.values()) {
            for (const thisPoem of thisEditor.poemQueue) {
                thisPoem.sendAllLinesTo(this.socket.id);
            }
        }
    }

    reinstateContext() {
        // TODO: Placeholder
        // super.reinstateContext();
        this.sendAllPoemLines();
    }
}

export default PoemSpectator;
