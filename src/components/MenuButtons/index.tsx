import * as React from "react";
import { useLocation } from "react-router-dom";

import HostButton from "../HostButton";
import { LibraryButton } from "../LibraryButton";
import Tutorial from "../Tutorial";

export function MenuButtons(): JSX.Element {
    const [ isGameScreen, setIsGameScreen ] = React.useState(false);
    const location = useLocation();
    const library = process.env.REACT_APP_IS_LIBRARY_ENABLED === "true"
        ? <LibraryButton />
        : null;

    const nonGameButtons = isGameScreen
        ? null
        : (<>{library}<HostButton /></>);

    // this is a fairly hacky way to tell whether the user is playing the game
    // in that case, we want to hide the library and host buttons
    React.useEffect(() => {
        setIsGameScreen(location.pathname === "/game");
    }, [ location ]);

    return <>
        <Tutorial />
        {nonGameButtons}
    </>;
}
