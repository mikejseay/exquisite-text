import { createContext, useContext } from "react";
import { IUserTableInfo } from "../types";

export const UserInfoContext = createContext<IUserTableInfo | null>(null);

export const useUserInfo = (): IUserTableInfo | null => {
    return useContext(UserInfoContext);
};
