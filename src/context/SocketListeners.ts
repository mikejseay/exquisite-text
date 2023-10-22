import { socket } from "./SocketActions";
import { ILine, ISocketInfoListeners, IUserTableInfo } from "../types";

import { shortDur } from "../constants";

export const socketListeners = ({ setUserInfo, setPoemsLines, setJoinErrorMessage } : ISocketInfoListeners) => {

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

    socket.on("joinError", joinErrorListener);
    socket.on("poemLines", poemsLinesListener);
    socket.on("userTableInfo", userTableInfoListener);

    return () => {
        socket.off("joinError", joinErrorListener);
        socket.off("poemLines", poemsLinesListener);
        socket.off("userTableInfo", userTableInfoListener);
    };

};
