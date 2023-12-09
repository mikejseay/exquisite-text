import * as React from "react";

import { useSocketInfo } from "../../context/SocketInfoProvider";

function RoomCode() {
    const { roomCode } = useSocketInfo();

    return (
        <div style={{ textAlign: "center" }} >
            <h2>Room Code: {roomCode}</h2>
        </div>
    );
}

export default RoomCode;
