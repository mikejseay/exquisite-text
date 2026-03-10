import * as React from "react";
import { useLocation } from "react-router-dom";

import HostButton from "../HostButton";
import Tutorial from "../Tutorial";

const screensWithLeaveButton = new Set([ "/game", "/lobby", "/spectate", "/end", "/canvas", "/canvasspectator" ]);

export function MenuButtons(): JSX.Element {
    const location = useLocation();
    const isInRoom = screensWithLeaveButton.has(location.pathname);

    const showTutorial = !screensWithLeaveButton.has(location.pathname);

    return <>
        {showTutorial && <Tutorial />}
        {!isInRoom && <HostButton />}
    </>;
}
