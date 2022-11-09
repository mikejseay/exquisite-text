import * as React from "react";
import { useLocation } from "react-router-dom";

import HostButton from "../HostButton";
import { LibraryButton } from "../LibraryButton";
import Tutorial from "../Tutorial";

export function MenuButtons(): JSX.Element {

    const location = useLocation();

    const [ isGameScreen, setIsGameScreen ] = React.useState(false);

    const nonGameButtons = isGameScreen
        ? null
        :  (<><LibraryButton /><HostButton /></>);

    // this is a fairly hacky way to tell whether the user is playing the game
    // in that case, we want to hide the library button
    React.useEffect(() => {
        setIsGameScreen(location.pathname === "/game");
    }, [ location ]);

    return <>
        <Tutorial />
        {nonGameButtons}
    </>;
}
