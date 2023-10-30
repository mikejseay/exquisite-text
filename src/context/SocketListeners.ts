import { socket } from "./SocketActions";
import { IGameSettingsInfo, ILine, ISocketInfoListeners, IUserTableInfo } from "../types";

import { shortDur } from "../constants";

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

    socket.on("poemLines", poemsLinesListener);
    socket.on("userTableInfo", userTableInfoListener);
    socket.on("joinError", joinErrorListener);
    socket.on("roomCode", roomCodeListener);
    socket.on("gameSettingsInfo", gameSettingsInfoListener);
    socket.on("gameSettingsEnabled", gameSettingsEnabledListener);

    return () => {
        socket.off("poemLines", poemsLinesListener);
        socket.off("userTableInfo", userTableInfoListener);
        socket.off("joinError", joinErrorListener);
        socket.off("roomCode", roomCodeListener);
        socket.off("gameSettingsInfo", gameSettingsInfoListener);
        socket.off("gameSettingsEnabled", gameSettingsEnabledListener);
    };

};
