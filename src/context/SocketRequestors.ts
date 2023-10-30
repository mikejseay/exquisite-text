import { socket } from "./SocketActions";
import { v4 as uuidv4 } from "uuid";
import isNil from "lodash/isNil";
import { LineLength } from "../types";

export const recognizeDevice = () => {

    // set this to true if you want to be able to connect to the game
    // multiple times from the same browser
    if (process.env.REACT_APP_DEBUG_SINGLE_BROWSER === "true") {
        // to debug I will send a random device id each time
        socket.emit("recognizeDevice", uuidv4());
    } else {
        // check if this device (browser) has visited the page before
        const firstVisit = !localStorage.getItem("device");
        if (firstVisit) {
            localStorage.setItem("device", uuidv4());
        }
        const deviceID = localStorage.getItem("device");
        if (!isNil(deviceID)) {
            socket.emit("recognizeDevice", deviceID);
        }
    }
};

export const getUserTableInfo = (shouldTest = false) => {
    socket.emit("getUserTableInfo", shouldTest);
};

export const getPoemsLines = (shouldTest = false) => {
    socket.emit("getPoemsLines", shouldTest);
};

export const createGameHost = (name: string) => {
    socket.emit("createGameHost", name);
};

export const requestJoinAsEditor = (roomId: string, name: string) => {
    console.log("handleWritePress activated as", name, "is trying to join", roomId);
    socket.emit("joinGameAs", "Editor", roomId.toUpperCase(), name.toUpperCase());
};

export const requestJoinAsSpectator = (roomId: string, name: string) => {
    console.log("handleSpectatePress activated");
    socket.emit("joinGameAs", "Spectator", roomId.toUpperCase(), name.toUpperCase());
};

export const getRoomCode = () => {
    console.log("getRoomCode");
    socket.emit("getRoomCode");
};

export const requestAlterGameSettings = (newLineLength: LineLength, nPoems: number, nRounds: number) => {
    socket.emit("alterGameSettings", {
        lineLength: newLineLength,
        nPoems,
        nRounds,
    });
};

export const requestStartGame = () => {
    socket.emit("startGame");
};

export const requestGetSettingsEnabled = () => {
    socket.emit("getSettingsEnabled");   // initial populate
};

export const requestGetGameSettingsInfo = () => {
    socket.emit("getGameSettingsInfo");
};

export const requestLeave = () => {
    socket.emit("leave");
};
