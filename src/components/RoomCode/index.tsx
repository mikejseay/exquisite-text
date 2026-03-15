import * as React from "react";

import { useSocketInfo } from "../../context/SocketInfoProvider";
import { roomCodeLabel, roomCodeValue, roomCodeWrapper } from "./styles";

function RoomCode({ prominent = false }: { prominent?: boolean }) {
    const { roomCode } = useSocketInfo();

    if (prominent) {
        return (
            <div style={roomCodeWrapper}>
                <div style={roomCodeLabel}>Room Code</div>
                <div style={roomCodeValue}>
                    {roomCode}
                </div>
            </div>
        );
    }

    return (
        <div style={roomCodeWrapper}>
            <h2>Room Code: {roomCode}</h2>
        </div>
    );
}

export default RoomCode;
