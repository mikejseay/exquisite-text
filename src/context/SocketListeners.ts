import { userInfo as userInfoTestData } from "../data/userInfo";
import { poemsLines as poemsLinesTestData } from "../data/multiplePoems";
import { socket } from "./SocketActions";
import { ILine, ISocketInfoListeners, IUserTableInfo } from "../types";


export const socketListeners = ({ setUserInfo, setPoemsLines } : ISocketInfoListeners) => {

    const shouldTest = false;
    if (shouldTest) {
        setUserInfo(userInfoTestData);
        setPoemsLines(poemsLinesTestData);
    } else {

        const poemsLinesListener = (myPoemLines: ILine[]) => {
            setPoemsLines(prevPoemsLines => {
                return [ ...prevPoemsLines, myPoemLines ];
            });
        };

        const userTableInfoListener = (info: IUserTableInfo) => {
            setUserInfo(info);
        };

        socket.on("poemLines", poemsLinesListener);
        socket.on("userTableInfo", userTableInfoListener);

        return () => {
            socket.off("poemLines", poemsLinesListener);
            socket.off("userTableInfo", userTableInfoListener);
        };
    }

};
