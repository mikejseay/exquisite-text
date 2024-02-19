import { socket } from "../components/SocketHandler";
import { IGameSettingsInfo, ILine, ISocketInfoListeners, IUserTableInfo, Point } from "../types";
import { shortDur } from "../constants";

export const socketListeners = ({
    setUserInfo,
    setPoemsLines,
    setJoinErrorMessage,
    setRoomCode,
    setSettingsEnabled,
    setLineLength,
    setNRounds,
    setNPoems,
    setLines,
    setLineEdits,
    setPoemInput,
    setPoemInputSpectate,
    setOnLastLine,
    setEditorActive,
    navigate,
    setStrokeHistory,
}: ISocketInfoListeners) => {
    // receivePoemsLinesListener
    const poemsLinesListener = (myPoemLines: ILine[]) => {
        setPoemsLines(prevPoemsLines => {
            return [ ...prevPoemsLines, myPoemLines ];
        });
    };

    const userTableInfoListener = (info: IUserTableInfo) => {
        setUserInfo(info);
    };

    const joinErrorListener = (errorMsg: string) => {
        setJoinErrorMessage(errorMsg);
        setTimeout(() => setJoinErrorMessage(""), shortDur);
    };

    // Event handlers for the line and the deleteLine events are set up for the Socket.IO connection.
    const roomCodeListener = (info: string) => {
        setRoomCode(info);
    };

    const gameSettingsInfoListener = (info: IGameSettingsInfo) => {
        setLineLength(info["lineLength"]);
        setNRounds(info["nRounds"]);
        setNPoems(info["nPoems"]);
    };

    const gameSettingsEnabledListener = (enabled: boolean) => {
        setSettingsEnabled(enabled);
    };

    const lineSpectatorListener = (poemIndex: number, line: string) => {
        setLines(prevLines => {
            return [ ...prevLines.slice(0, poemIndex), [ ...prevLines[poemIndex], line ], ...prevLines.slice(poemIndex + 1) ];
        },
        );
    };

    const lineEditSpectatorListener = (poemIndex: number, value: string) => {
        setLineEdits(prevLineEdits => [
            ...prevLineEdits.slice(0, poemIndex),
            value,
            ...prevLineEdits.slice(poemIndex + 1),
        ]);
    };

    const lineEditListener = (lineEdit: string) => {
        setPoemInput(lineEdit);
    };

    const lineEditorWatchListener = (lineEditorWatchVal: string) => {
        setPoemInputSpectate(lineEditorWatchVal);
    };

    const lastLineListener = (lastLine: boolean) => {
        setOnLastLine(lastLine);
    };

    const editorActiveListener = (editorActiveFromServer: boolean) => {
        setEditorActive(editorActiveFromServer);
    };

    const navigateListener = (targetRoute: string) => {
        console.log("navigateListener activated targeting", targetRoute);
        navigate(targetRoute);
    };

    const strokeHistoryListener = (strokeHistory: Point[][]) => {
        console.log("strokeHistoryListener activated targeting", JSON.stringify(strokeHistory));
        setStrokeHistory(strokeHistory);
    };

    socket.on("stcPoemLines", poemsLinesListener);
    socket.on("stcUserTableInfo", userTableInfoListener);
    socket.on("stcJoinError", joinErrorListener);
    socket.on("stcRoomCode", roomCodeListener);
    socket.on("stcGameSettingsInfo", gameSettingsInfoListener);
    socket.on("stcGameSettingsEnabled", gameSettingsEnabledListener);
    socket.on("stcLineSpectator", lineSpectatorListener);
    socket.on("stcLineEditSpectator", lineEditSpectatorListener);
    socket.on("stcLineEdit", lineEditListener);
    socket.on("stcLineEditorWatch", lineEditorWatchListener);
    socket.on("stcLastLine", lastLineListener);
    socket.on("stcEditorActive", editorActiveListener);
    socket.on("stcNavigate", navigateListener);
    socket.on("stcStrokeHistory", strokeHistoryListener);

    return () => {
        socket.off("stcPoemLines", poemsLinesListener);
        socket.off("stcUserTableInfo", userTableInfoListener);
        socket.off("stcJoinError", joinErrorListener);
        socket.off("stcRoomCode", roomCodeListener);
        socket.off("stcGameSettingsInfo", gameSettingsInfoListener);
        socket.off("stcGameSettingsEnabled", gameSettingsEnabledListener);
        socket.off("stcLineSpectator", lineSpectatorListener);
        socket.off("stcLineEditSpectator", lineEditSpectatorListener);
        socket.off("stcLineEdit", lineEditListener);
        socket.off("stcLineEditorWatch", lineEditorWatchListener);
        socket.off("stcLastLine", lastLineListener);
        socket.off("stcEditorActive", editorActiveListener);
        socket.off("stcNavigate", navigateListener);
        socket.off("stcStrokeHistory", strokeHistoryListener);
    };
};
