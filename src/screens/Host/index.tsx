import * as React from "react";

import { useSocket } from "../../components/App";
import UserTable from "../../components/UserTable";
import GameSettings from "../../components/GameSettings";
import { generateAlphaString } from "../../helpers";
import { roomCodeLength } from "../../constants";

export default function Host() {
    const { socket } = useSocket();

    const rootURLDisplay = window.location.host;
    const rootURLRoute = "/";
    const roomId = generateAlphaString(roomCodeLength);

    socket.emit("createGameHost", roomId);

    return (
        <main style={{ textAlign: "center" }}>
            <h2>
                <p>Go to&nbsp;
                    <a
                        href={rootURLRoute}
                        rel="noopener noreferrer"
                        target={rootURLRoute}
                    >
                        {rootURLDisplay}
                    </a>.
                </p>
            </h2>
            <h2>{`Enter room code: ${roomId}`}</h2>
            <UserTable />
            <GameSettings />
        </main>
    );
}
