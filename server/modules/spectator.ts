import { roomIdToRoom } from "./globals";
import Member from "./member";

class Spectator extends Member {
    joinRoom() {
        super.joinRoom();
        this.socket.join(this.roomId + "_Spectators");
    }

    leaveRoom() {
        super.leaveRoom();
        this.socket.leave(this.roomId + "_Spectators");
        const thisRoom = roomIdToRoom.get(this.roomId);
        if (!thisRoom) {
            console.log("thisRoom not found");
            return;
        }
        thisRoom.removeSpectator(this.deviceID);
    }

    setReceive() {
        super.setReceive();
        this.socket.on("getLines", () => this.getAllPoemLines());
        this.socket.on("getCanvas", () => this.getCanvas());
    }

    unsetReceive() {
        super.unsetReceive();
        this.socket.removeAllListeners("getLines");
    }

    getAllPoemLines() {
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

    getCanvas() {
        const thisRoom = roomIdToRoom.get(this.roomId);
        if (!thisRoom) {
            console.log("thisRoom not found");
            return;
        }
        const theCanvas = thisRoom.finishedCanvas;
        // for (const thisEditor of thisRoom.editors.values()) {
        // }
        this.io
            .to(this.socket.id)
            .emit("strokeHistory", theCanvas);
    }

    disconnect() {
        this.lastActivity = Date.now(); // refresh activity
        super.disconnect();
    }
}

export default Spectator;
