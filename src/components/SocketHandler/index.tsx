import * as React from "react";
import { SocketInfoContext } from "../../context/SocketInfoProvider";
import { ILine, IPanel, IUserTableInfo, LineLength, Medium, Point } from "../../types";
import { defaultGameSettings } from "../../constants";
import { socketListeners } from "../../context/SocketListeners";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
const serverPath: URL["pathname"] | URL["href"] = isDevelopment
    ? `http://${window.location.hostname}:3000`
    : "/";

export const socket = io(serverPath);


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
    const [ lineLength, setLineLength ] = React.useState<LineLength>(LineLength.SHORT);
    const [ nRounds, setNRounds ] = React.useState<number>(defaultGameSettings.nRounds);
    const [ nPoems, setNPoems ] = React.useState<number>(defaultGameSettings.nPoems);
    const [ nDrawings, setNDrawings ] = React.useState<number>(defaultGameSettings.nDrawings);
    const [ lines, setLines ] = React.useState<Array<Array<ILine["content"]>>>([ [], [], [], [] ]);
    const [ panels, setPanels ] = React.useState<Array<Array<IPanel["content"]>>>([ [], [], [], [] ]);
    const [ lineEdits, setLineEdits ] = React.useState<Array<string>>([ "", "", "", "" ]);
    const [ poemInput, setPoemInput ] = React.useState<string>("");
    const [ poemInputSpectate, setPoemInputSpectate ] = React.useState<string>("");
    const [ onLastContribution, setOnLastContribution ] = React.useState<boolean>(false);
    const [ editorActive, setEditorActive ] = React.useState<boolean>(false);
    const [ strokeHistory, setStrokeHistory ] = React.useState<Point[][]>([]);
    const [ completedDrawings, setCompletedDrawings ] = React.useState<Point[][][][]>([]);
    const [ medium, setMedium ] = React.useState<Medium>(Medium.ART);

    const navigate = useNavigate();

    // The crucial useEffect which contains
    React.useEffect(() => socketListeners({
        setUserInfo,
        setPoemsLines,
        setJoinErrorMessage,
        setRoomCode,
        setSettingsEnabled,
        setLineLength,
        setNRounds,
        setNPoems,
        setNDrawings,
        setLines,
        setPanels,
        setLineEdits,
        setPoemInput,
        setPoemInputSpectate,
        setOnLastContribution,
        setEditorActive,
        navigate,
        setStrokeHistory,
        setCompletedDrawings,
        setMedium,
    }),
    [ socketListeners ],
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
            nDrawings,
            setLineLength,
            setNRounds,
            setNPoems,
            setNDrawings,
            lines,
            lineEdits,
            panels,
            poemInput,
            poemInputSpectate,
            onLastContribution,
            editorActive,
            setPoemInput,
            strokeHistory,
            setStrokeHistory,
            completedDrawings,
            setCompletedDrawings,
            medium,
            setMedium,
        }}>
            {children}
        </SocketInfoContext.Provider>
    );
}
