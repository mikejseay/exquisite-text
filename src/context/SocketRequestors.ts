import { socket } from "../components/SocketHandler";
import { v4 as uuidv4 } from "uuid";
import isNil from "lodash/isNil";
import { LineLength, Point } from "../types";

export const emitRecognizeDevice = () => {

    // set this to true if you want to be able to connect to the game
    // multiple times from the same browser
    if (process.env.REACT_APP_DEBUG_SINGLE_BROWSER === "true") {
        // to debug I will send a random device id each time
        socket.emit("ctsRecognizeDevice", uuidv4());
    } else {
        // check if this device (browser) has visited the page before
        const firstVisit = !localStorage.getItem("device");
        if (firstVisit) {
            localStorage.setItem("device", uuidv4());
        }
        const deviceID = localStorage.getItem("device");
        if (!isNil(deviceID)) {
            socket.emit("ctsRecognizeDevice", deviceID);
        }
    }
};

export const getUserTableInfo = (shouldTest = false) => {
    socket.emit("ctsGetUserTableInfo", shouldTest);
};

export const getPoemsLines = (shouldTest = false) => {
    socket.emit("ctsGetPoemsLines", shouldTest);
};

export const createGameHost = (name: string) => {
    socket.emit("ctsCreateGameHost", name);
};

export const emitJoinAsEditor = (roomId: string, name: string) => {
    console.log("handleWritePress activated as", name, "is trying to join", roomId);
    socket.emit("ctsJoinGameAs", "Editor", roomId.toUpperCase(), name.toUpperCase());
};

export const emitJoinAsSpectator = (roomId: string, name: string) => {
    console.log("handleSpectatePress activated");
    socket.emit("ctsJoinGameAs", "Spectator", roomId.toUpperCase(), name.toUpperCase());
};

export const emitAlterGameSettings = (newLineLength: LineLength, nPoems: number, nRounds: number) => {
    socket.emit("ctsAlterGameSettings", {
        lineLength: newLineLength,
        nPoems,
        nRounds,
    });
};

export const emitStartGame = () => {
    socket.emit("ctsStartGame");
};

export const emitGetSettingsEnabled = () => {
    socket.emit("ctsGetSettingsEnabled");   // initial populate
};

export const emitGetGameSettingsInfo = () => {
    socket.emit("ctsGetGameSettingsInfo");
};

export const emitLeave = () => {
    socket.emit("ctsLeave");
};

export const emitGetLineEdit = () => {
    socket.emit("ctsGetLineEdit");
};

export const emitGetEditorActive = () => {
    socket.emit("ctsGetEditorActive");
};

export const emitGetLastLineStatus = () => {
    socket.emit("ctsGetLastLineStatus");
};

export const emitUpdateLineEdit = (value: string) => {
    socket.emit("ctsLineEdit", value);
};

export const emitPassTurn = (firstPart: string, secondPart: string) => {
    socket.emit("ctsPassTurn", firstPart, secondPart);
};

export const emitSendLastLine = (value: string | null) => {
    socket.emit("ctsLastLine", value);
};

export const emitSendCanvas = (value: Point[][] | null) => {
    console.log("sendCanvas:", value);
    socket.emit("ctsSendCanvas", value);
};

export const emitGetCanvas = () => {
    socket.emit("ctsGetCanvas");
};

export const emitJoinAsCanvasEditor = (roomId: string, name: string) => {
    console.log("handleWritePress activated as", name, "is trying to join", roomId);
    socket.emit("ctsJoinGameAs", "Editor", roomId.toUpperCase(), name.toUpperCase(), true);
};

export const emitJoinAsCanvasSpectator = (roomId: string, name: string) => {
    console.log("handleSpectatePress activated");
    socket.emit("ctsJoinGameAs", "Spectator", roomId.toUpperCase(), name.toUpperCase(), true);
};
