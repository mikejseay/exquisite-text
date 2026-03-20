import PoemGameSettings from "components/PoemGameSettings/PoemGameSettings";

import UserTable from "components/UserTable/UserTable";
import { roomCodeLength } from "constants/constants";
import { generateAlphaString } from "helpers/helpers";
import { textCentered } from "styles/common";

export default function Host() {
    const rootURLDisplay = window.location.host;
    const rootURLRoute = "/";
    const roomID = generateAlphaString(roomCodeLength);

    return (
        <main style={textCentered}>
            <h2>
                <p>
                    Go to&nbsp;
                    <a href={rootURLRoute} rel="noopener noreferrer" target={rootURLRoute}>
                        {rootURLDisplay}
                    </a>
                    .
                </p>
            </h2>
            <h2>{`Enter room code: ${roomID}`}</h2>
            <UserTable />
            <PoemGameSettings />
        </main>
    );
}
