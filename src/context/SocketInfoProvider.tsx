import { createContext, useContext } from "react";
import { ISocketInfo, LineLength } from "../types";

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
    },
);

export const useSocketInfo = (): ISocketInfo => {
    return useContext(SocketInfoContext);
};
