import * as React from "react";

import { useSocketInfo } from "../../context/SocketInfoProvider";

function RoomCode({ prominent = false }: { prominent?: boolean }) {
    const { roomCode } = useSocketInfo();

    if (prominent) {
        return (
            <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.9rem", opacity: 0.7 }}>Room Code</div>
                <div style={{
                    fontSize: "2.5rem",
                    fontWeight: "bold",
                    letterSpacing: "0.15em",
                }}>
                    {roomCode}
                </div>
            </div>
        );
    }

    return (
        <div style={{ textAlign: "center" }} >
            <h2>Room Code: {roomCode}</h2>
        </div>
    );
}

export default RoomCode;
