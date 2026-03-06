import * as React from "react";
import { useLocation } from "react-router-dom";

import HostButton from "../HostButton";
import Tutorial from "../Tutorial";

const screensWithLeaveButton = new Set([ "/game", "/lobby", "/spectate", "/end", "/canvas", "/canvasspectator" ]);

export function MenuButtons(): JSX.Element {
    const [ isGameScreen, setIsGameScreen ] = React.useState(false);
    const location = useLocation();

    const nonGameButtons = isGameScreen
        ? null
        : <HostButton />;

    // this is a fairly hacky way to tell whether the user is playing the game
    // in that case, we want to hide the library and host buttons
    React.useEffect(() => {
        setIsGameScreen(location.pathname === "/game");
    }, [ location ]);

    const showTutorial = !screensWithLeaveButton.has(location.pathname);

    return <>
        {showTutorial && <Tutorial />}
        {nonGameButtons}
    </>;
}
