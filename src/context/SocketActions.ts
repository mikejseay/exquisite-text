import { io } from "socket.io-client";
import { socketListeners } from "./SocketListeners";
import { ISocketInfoListeners } from "../types";

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
const serverPath: URL["pathname"] | URL["href"] = isDevelopment
    ? `http://${window.location.hostname}:3000`
    : "/";

export const socket = io(serverPath);

export const initSockets = ({ setUserInfo, setPoemsLines, setJoinErrorMessage } : ISocketInfoListeners) => {

    console.log("initSockets about to connect to", serverPath);
    socketListeners( { setUserInfo, setPoemsLines, setJoinErrorMessage } );
};
