import { roomIdToRoom } from "./globals";
import Member from "./member";

class Spectator extends Member {
    joinRoom() {
        super.joinRoom();
        this.socket.join(`${this.roomId}_Spectators`);
    }

    leaveRoom() {
        super.leaveRoom();
        this.socket.leave(`${this.roomId}_Spectators`);
        const thisRoom = roomIdToRoom.get(this.roomId);
        if (!thisRoom) {
            console.log("thisRoom not found");
            return;
        }
        thisRoom.removeSpectator(this.deviceID);
    }

    setReceive() {
        super.setReceive();
        this.socket.on("ctsRequestCanvas", () => this.sendCanvas());
    }

    unsetReceive() {
        super.unsetReceive();
        this.socket.removeAllListeners("ctsRequestCanvas");
    }

    sendCanvas() {
        const thisRoom = roomIdToRoom.get(this.roomId);
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
        const thisRoom = roomIdToRoom.get(this.roomId);
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

    disconnect() {
        this.lastActivity = Date.now(); // refresh activity
        super.disconnect();
    }

    reinstateContext() {
        // TODO: Placeholder
        // super.reinstateContext();
        this.sendAllPoemLines();
    }
}

export default Spectator;
