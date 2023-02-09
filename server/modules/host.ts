import Member from "./member";

class Host extends Member {
    // does not enforce device ID constraint
    // (same device can be Host AND either of Editor or Spectator)

    joinRoom() {
    // unlike other Members, this does NOT navigate to lobby
        this.socket.join(this.roomId);
        this.setReceive(); // listen for certain messages from client
    }

    // setSend
    // super.setSend()
    // eventually send cool game state info to inform hostGameView
}

export default Host;
