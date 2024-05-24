import * as React from "react";

import UserTable from "../../components/UserTable";
import PoemGameSettings from "../../components/PoemGameSettings";
import { generateAlphaString } from "../../helpers";
import { roomCodeLength } from "../../constants";
import Typography from "@mui/material/Typography";

export default function Host() {

    const rootURLDisplay = window.location.host;
    const rootURLRoute = "/";
    const roomID = generateAlphaString(roomCodeLength);

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
            <h2>{`Enter room code: ${roomID}`}</h2>
            <UserTable />
            <PoemGameSettings />
        </main>
    );
}
