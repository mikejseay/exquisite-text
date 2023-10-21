import { createContext, useContext } from "react";
import { ISocketInfo } from "../types";

export const SocketInfoContext = createContext<ISocketInfo>(
    {
        userInfo: null,
        poemsLines: null,
    },
);

export const useSocketInfo = (): ISocketInfo => {
    return useContext(SocketInfoContext);
};
