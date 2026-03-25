import HostButton from "components/HostButton/HostButton";
import Tutorial from "components/Tutorial/Tutorial";
import { useLocation } from "react-router-dom";

const screensWithLeaveButton = new Set(["/game", "/lobby", "/spectate", "/end", "/canvas", "/canvasspectator"]);

export function MenuButtons(): JSX.Element {
    const location = useLocation();
    const isInRoom = screensWithLeaveButton.has(location.pathname);

    const showTutorial = !screensWithLeaveButton.has(location.pathname);

    return (
        <>
            {showTutorial && <Tutorial />}
            {!isInRoom && <HostButton />}
        </>
    );
}
