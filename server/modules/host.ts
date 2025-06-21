import Member from "./member";
import { sendCompletedArtTestData } from "../utilities/socketUtils";
import { Medium } from "../../src/types";

class Host extends Member {
    // does not enforce device ID constraint
    // (same device can be Host AND either of Editor or Spectator)

    joinRoom() {
    // unlike other Members, this does NOT navigate to lobby
        this.socket.join(this.roomID);
        this.setReceive(); // listen for certain messages from client
    }

    setReceive() {
        super.setReceive();
        // only used to test the end screen, but we allow it to be parasitic for now
        this.socket.on("ctsRequestPoemsLines", () => sendCompletedArtTestData(this, Medium.POETRY));
        this.socket.on("ctsRequestDrawings", () => sendCompletedArtTestData(this, Medium.DRAWING));
    }

    unsetReceive() {
        super.unsetReceive();
        // only used to test the end screen, but we allow it to be parasitic for now
        this.socket.removeAllListeners("ctsRequestPoemsLines");
        this.socket.removeAllListeners("ctsRequestDrawings");
    }
}

export default Host;
