import * as React from "react";
import { SocketInfoContext } from "../../context/SocketInfoProvider";
import { ILine, IUserTableInfo, LineLength } from "../../types";
import { initSockets } from "../../context/SocketActions";
import { defaultGameSettings } from "../../constants";

type Props = {
    children: JSX.Element
}

export default function SocketHandler({ children }: Props) {
    // instead of creating the socket state here,
    // only create the socket and pass it into the correct React router outlet
    // (basically a way to pass a socket for useContext type usage)
    // if a socket is necessary
    // no socket needed for Join page, Library, poem permalink (Page)
    const [ userInfo, setUserInfo ] = React.useState<IUserTableInfo>({} as IUserTableInfo);
    const [ poemsLines, setPoemsLines ] = React.useState<Array<ILine[]>>([]);
    const [ joinErrorMessage, setJoinErrorMessage ] = React.useState<string>("");
    const [ roomCode, setRoomCode ] = React.useState<string>("");
    const [ settingsEnabled, setSettingsEnabled ] = React.useState<boolean>(false);
    const [ lineLength, setLineLength ] = React.useState<LineLength>(LineLength.short);
    const [ nRounds, setNRounds ] = React.useState<number>(defaultGameSettings.nRounds);
    const [ nPoems, setNPoems ] = React.useState<number>(defaultGameSettings.nPoems);

    // The crucial useEffect which contains
    React.useEffect(() => initSockets(
        {
            setUserInfo,
            setPoemsLines,
            setJoinErrorMessage,
            setRoomCode,
            setSettingsEnabled,
            setLineLength,
            setNRounds,
            setNPoems,
        }),
    [ initSockets ],
    );

    return (
        <SocketInfoContext.Provider value={{
            userInfo,
            poemsLines,
            joinErrorMessage,
            roomCode,
            setRoomCode,
            settingsEnabled,
            lineLength,
            nRounds,
            nPoems,
            setLineLength,
            setNRounds,
            setNPoems,

        }}>
            {children}
        </SocketInfoContext.Provider>
    );
}
