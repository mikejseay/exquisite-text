import * as React from "react";

import { useSocket } from "../../components/App";
import UserTable from "../../components/UserTable";
import GameSettings from "../../components/GameSettings";
import { generateAlphaString } from "../../helpers";
import { roomCodeLength } from "../../constants";

export default function Host() {
    const { socket } = useSocket();

    const rootURL = window.location.host;
    const roomID = generateAlphaString(roomCodeLength);

    socket.emit("createGameHost", roomID);

    return (
        <main style={{ textAlign: "center" }}>
            <h2>
                <p>Go to&nbsp;
                    <a
                        href={rootURL}
                        rel="noopener noreferrer"
                        target={rootURL}
                    >
                        {rootURL}
                    </a>.
                </p>
            </h2>
            <h2>{`Enter room code: ${roomID}`}</h2>
            <UserTable />
            <GameSettings />
        </main>
    );
}
