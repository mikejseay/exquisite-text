import { socket } from "./SocketActions";
import { IGameSettingsInfo, ILine, ISocketInfoListeners, IUserTableInfo } from "../types";

import { lineConstraints, shortDur } from "../constants";

export const socketListeners = (
    {
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
    } : ISocketInfoListeners) => {

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
        setLineEdits(prevLineEdits => {
            return [
                ...prevLineEdits.slice(0, poemIndex),
                value,
                ...prevLineEdits.slice(poemIndex + 1),
            ];
        });
    };

    const lineEditListener = (lineEdit: string) => {
        setPoemInput(lineEdit);
    };

    const lineEditorWatchListener = (lineEditorWatchVal: string) => {
        setPoemInputSpectate(lineEditorWatchVal);
    };

    const lastLineListener = (lastLine: boolean) => {
        setOnLastLine(lastLine);
        // const constraints = lineConstraints[lineLength];
        // if (lastLine) {
        //     setMaxCharsOnLineTwo(constraints.maxCharsOnLineOne);
        //     setIdealCharsOnLineTwo(constraints.idealCharsOnLineOne);
        // } else {
        //     setMaxCharsOnLineTwo(constraints.maxCharsOnLineTwo);
        //     setIdealCharsOnLineTwo(constraints.idealCharsOnLineTwo);
        // }
    };

    const editorActiveListener = (editorActiveFromServer: boolean) => {
        setEditorActive(editorActiveFromServer);
        // setShouldDisplaySecondLine(false);
        // if (editorActiveFromServer) {
        //     setTextAreaVisible(true);
        //     setHelpMessage("Complete a line of poetry.");
        //     setPoemDoneVisible(true);
        // } else {
        //     setTextAreaVisible(false);
        //     setHelpMessage("Your friend is writing ⤵");
        //     setPassEnabled(false);
        //     setPoemDoneVisible(false);
        // }
    };

    socket.on("poemLines", poemsLinesListener);
    socket.on("userTableInfo", userTableInfoListener);
    socket.on("joinError", joinErrorListener);
    socket.on("roomCode", roomCodeListener);
    socket.on("gameSettingsInfo", gameSettingsInfoListener);
    socket.on("gameSettingsEnabled", gameSettingsEnabledListener);
    socket.on("lineSpectator", lineSpectatorListener);
    socket.on("lineEditSpectator", lineEditSpectatorListener);
    socket.on("lineEdit", lineEditListener);
    socket.on("lineEditorWatch", lineEditorWatchListener);
    socket.on("lastLine", lastLineListener);
    socket.on("editorActive", editorActiveListener);

    return () => {
        socket.off("poemLines", poemsLinesListener);
        socket.off("userTableInfo", userTableInfoListener);
        socket.off("joinError", joinErrorListener);
        socket.off("roomCode", roomCodeListener);
        socket.off("gameSettingsInfo", gameSettingsInfoListener);
        socket.off("gameSettingsEnabled", gameSettingsEnabledListener);
        socket.off("lineSpectator", lineSpectatorListener);
        socket.off("lineEditSpectator", lineEditSpectatorListener);
        socket.off("lineEdit", lineEditListener);
        socket.off("lineEditorWatch", lineEditorWatchListener);
        socket.off("lastLine", lastLineListener);
        socket.off("editorActive", editorActiveListener);
    };

};
