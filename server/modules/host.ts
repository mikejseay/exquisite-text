import Member from "./member";
import { sendPoemsLinesInfo } from "../utilities/sockets";

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
        this.socket.on("ctsRequestPoemsLines", (shouldTest) => sendPoemsLinesInfo(this, shouldTest));
    }

    unsetReceive() {
        super.unsetReceive();
        // only used to test the end screen, but we allow it to be parasitic for now
        this.socket.removeAllListeners("ctsRequestPoemsLines");
    }
}

export default Host;
