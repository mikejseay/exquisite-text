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

export const emitRequestUserTableInfo = (shouldTest = false) => {
    socket.emit("ctsRequestUserTableInfo", shouldTest);
};

export const emitRequestPoemsLines = (shouldTest = false) => {
    socket.emit("ctsRequestPoemsLines", shouldTest);
};

export const emitCreateGameHost = (name: string) => {
    socket.emit("ctsCreateGameHost", name);
};

export const emitJoinAs = (memberType: string, roomId: string, name: string, isTest = false) => {
    console.log("emitJoinAs activated as", name, "is trying to join", roomId, "as", memberType);
    socket.emit("ctsJoinGameAs", memberType, roomId.toUpperCase(), name.toUpperCase(), isTest);
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

export const emitRequestSettingsEnabled = () => {
    socket.emit("ctsRequestSettingsEnabled");   // initial populate
};

export const emitRequestGameSettingsInfo = () => {
    socket.emit("ctsRequestGameSettingsInfo");
};

export const emitLeave = () => {
    socket.emit("ctsLeave");
};

export const emitRequestLineEdit = () => {
    socket.emit("ctsRequestLineEdit");
};

export const emitRequestEditorActive = () => {
    socket.emit("ctsRequestEditorActive");
};

export const emitRequestLastLineStatus = () => {
    socket.emit("ctsRequestLastLineStatus");
};

export const emitEditLine = (value: string) => {
    socket.emit("ctsEditLine", value);
};

export const emitSendLineParts = (firstPart: string, secondPart: string) => {
    socket.emit("ctsSendLineParts", firstPart, secondPart);
};

export const emitSendLastLine = (value: string | null) => {
    socket.emit("ctsSendLastLine", value);
};

export const emitSendCanvas = (value: Point[][] | null) => {
    console.log("sendCanvas:", value);
    socket.emit("ctsSendCanvas", value);
};

export const emitRequestCanvas = () => {
    socket.emit("ctsRequestCanvas");
};
