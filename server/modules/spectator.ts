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
        thisRoom.removeSpectator(this.deviceID);
    }

    setReceive() {
        super.setReceive();
        this.socket.on("getLines", () => this.getAllPoemLines());
    }

    unsetReceive() {
        super.unsetReceive();
        this.socket.removeAllListeners("getLines");
    }

    getAllPoemLines() {
        const thisRoom = roomIdToRoom.get(this.roomId);
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
}

export default Spectator;
