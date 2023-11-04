import { createContext, useContext } from "react";
import { ISocketInfo } from "../types";

export const SocketInfoContext = createContext<ISocketInfo>(
    {
        userInfo: null,
        poemsLines: null,
        joinErrorMessage: null,
        roomCode: null,
        setRoomCode: () => null,
        settingsEnabled: null,
        lineLength: null,
        nRounds: null,
        nPoems: null,
        setLineLength: () => null,
        setNRounds: () => null,
        setNPoems: () => null,
        lines: null,
        lineEdits: null,
        poemInput: null,
        poemInputSpectate: null,
        onLastLine: null,
        editorActive: null,
        setPoemInput: () => null,
    },
);

export const useSocketInfo = (): ISocketInfo => {
    return useContext(SocketInfoContext);
};
