import { socket } from "../components/SocketHandler";
import { v4 as uuidv4 } from "uuid";
import isNil from "lodash/isNil";
import { LineLength, Point } from "../types";

export const emitRecognizeDevice = () => {

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

export const emitJoinAsEditor = (roomId: string, name: string) => {
    console.log("handleWritePress activated as", name, "is trying to join", roomId);
    socket.emit("joinGameAs", "Editor", roomId.toUpperCase(), name.toUpperCase());
};

export const emitJoinAsSpectator = (roomId: string, name: string) => {
    console.log("handleSpectatePress activated");
    socket.emit("joinGameAs", "Spectator", roomId.toUpperCase(), name.toUpperCase());
};

export const emitAlterGameSettings = (newLineLength: LineLength, nPoems: number, nRounds: number) => {
    socket.emit("alterGameSettings", {
        lineLength: newLineLength,
        nPoems,
        nRounds,
    });
};

export const emitStartGame = () => {
    socket.emit("startGame");
};

export const emitGetSettingsEnabled = () => {
    socket.emit("getSettingsEnabled");   // initial populate
};

export const emitGetGameSettingsInfo = () => {
    socket.emit("getGameSettingsInfo");
};

export const emitLeave = () => {
    socket.emit("leave");
};

export const emitGetLineEdit = () => {
    socket.emit("getLineEdit");
};

export const emitGetEditorActive = () => {
    socket.emit("getEditorActive");
};

export const emitGetLastLineStatus = () => {
    socket.emit("getLastLineStatus");
};

export const emitUpdateLineEdit = (value: string) => {
    socket.emit("lineEdit", value);
};

export const emitPassTurn = (firstPart: string, secondPart: string) => {
    socket.emit("passTurn", firstPart, secondPart);
};

export const emitSendLastLine = (value: string | null) => {
    socket.emit("lastLine", value);
};

export const emitSendCanvas = (value: Point[][] | null) => {
    console.log("sendCanvas:", value);
    socket.emit("sendCanvas", value);
};

export const emitGetCanvas = () => {
    socket.emit("getCanvas");
};

export const emitJoinAsCanvasEditor = (roomId: string, name: string) => {
    console.log("handleWritePress activated as", name, "is trying to join", roomId);
    socket.emit("joinGameAs", "Editor", roomId.toUpperCase(), name.toUpperCase(), true);
};

export const emitJoinAsCanvasSpectator = (roomId: string, name: string) => {
    console.log("handleSpectatePress activated");
    socket.emit("joinGameAs", "Spectator", roomId.toUpperCase(), name.toUpperCase(), true);
};
