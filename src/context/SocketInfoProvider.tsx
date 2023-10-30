import { createContext, useContext } from "react";
import { ISocketInfo, LineLength } from "../types";

export const SocketInfoContext = createContext<ISocketInfo>(
    {
        userInfo: null,
        poemsLines: null,
        joinErrorMessage: null,
        roomCode: null,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        setRoomCode: () => {},
        settingsEnabled: null,
        lineLength: null,
        nRounds: null,
        nPoems: null,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        setLineLength: () => {},
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        setNRounds: () => {},
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        setNPoems: () => {},
    },
);

export const useSocketInfo = (): ISocketInfo => {
    return useContext(SocketInfoContext);
};
