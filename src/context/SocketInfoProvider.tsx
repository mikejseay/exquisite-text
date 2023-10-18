import { createContext, useContext } from "react";
import { IUserTableInfo } from "../types";

export const SocketInfoContext = createContext<IUserTableInfo | null>(null);

export const useSocketInfo = (): IUserTableInfo | null => {
    return useContext(SocketInfoContext);
};
