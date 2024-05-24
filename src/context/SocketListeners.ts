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
    setNDrawings,
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
    const receivePoemsLines = (myPoemLines: ILine[]) => {
        setPoemsLines(prevPoemsLines => {
            return [ ...prevPoemsLines, myPoemLines ];
        });
    };

    const receiveUserTableInfo = (info: IUserTableInfo) => {
        setUserInfo(info);
    };

    const receiveJoinError = (errorMsg: string) => {
        setJoinErrorMessage(errorMsg);
        setTimeout(() => setJoinErrorMessage(""), shortDur);
    };

    // Event handlers for the line and the deleteLine events are set up for the Socket.IO connection.
    const receiveRoomCode = (info: string) => {
        setRoomCode(info);
    };

    const receiveGameSettingsInfo = (info: IGameSettingsInfo) => {
        setLineLength(info["lineLength"]);
        setNRounds(info["nRounds"]);
        setNPoems(info["nPoems"]);
        setNDrawings(info["nDrawings"]);
    };

    const receiveGameSettingsEnabled = (enabled: boolean) => {
        setSettingsEnabled(enabled);
    };

    const receiveLineSpectator = (poemIndex: number, line: string) => {
        setLines(prevLines => {
            return [ ...prevLines.slice(0, poemIndex), [ ...prevLines[poemIndex], line ], ...prevLines.slice(poemIndex + 1) ];
        },
        );
    };

    const receiveLineEditSpectator = (poemIndex: number, value: string) => {
        setLineEdits(prevLineEdits => [
            ...prevLineEdits.slice(0, poemIndex),
            value,
            ...prevLineEdits.slice(poemIndex + 1),
        ]);
    };

    const receiveLineEdit = (lineEdit: string) => {
        setPoemInput(lineEdit);
    };

    const receiveLineEditorWatch = (lineEditorWatchVal: string) => {
        setPoemInputSpectate(lineEditorWatchVal);
    };

    const receiveLastLine = (lastLine: boolean) => {
        setOnLastLine(lastLine);
    };

    const receiveEditorActive = (editorActiveFromServer: boolean) => {
        setEditorActive(editorActiveFromServer);
    };

    const receiveNavigate = (targetRoute: string) => {
        console.log("receiveNavigate activated targeting", targetRoute);
        navigate(targetRoute);
    };

    const receiveStrokeHistory = (strokeHistory: Point[][]) => {
        console.log("receiveStrokeHistory activated targeting", JSON.stringify(strokeHistory));
        setStrokeHistory(strokeHistory);
    };

    socket.on("stcPoemLines", receivePoemsLines);
    socket.on("stcUserTableInfo", receiveUserTableInfo);
    socket.on("stcJoinError", receiveJoinError);
    socket.on("stcRoomCode", receiveRoomCode);
    socket.on("stcGameSettingsInfo", receiveGameSettingsInfo);
    socket.on("stcGameSettingsEnabled", receiveGameSettingsEnabled);
    socket.on("stcLineSpectator", receiveLineSpectator);
    socket.on("stcLineEditSpectator", receiveLineEditSpectator);
    socket.on("stcLineEdit", receiveLineEdit);
    socket.on("stcLineEditorWatch", receiveLineEditorWatch);
    socket.on("stcLastLine", receiveLastLine);
    socket.on("stcEditorActive", receiveEditorActive);
    socket.on("stcNavigate", receiveNavigate);
    socket.on("stcStrokeHistory", receiveStrokeHistory);

    return () => {
        socket.off("stcPoemLines", receivePoemsLines);
        socket.off("stcUserTableInfo", receiveUserTableInfo);
        socket.off("stcJoinError", receiveJoinError);
        socket.off("stcRoomCode", receiveRoomCode);
        socket.off("stcGameSettingsInfo", receiveGameSettingsInfo);
        socket.off("stcGameSettingsEnabled", receiveGameSettingsEnabled);
        socket.off("stcLineSpectator", receiveLineSpectator);
        socket.off("stcLineEditSpectator", receiveLineEditSpectator);
        socket.off("stcLineEdit", receiveLineEdit);
        socket.off("stcLineEditorWatch", receiveLineEditorWatch);
        socket.off("stcLastLine", receiveLastLine);
        socket.off("stcEditorActive", receiveEditorActive);
        socket.off("stcNavigate", receiveNavigate);
        socket.off("stcStrokeHistory", receiveStrokeHistory);
    };
};
