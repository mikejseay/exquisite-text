import { socket } from "../components/SocketHandler";
import { v4 as uuidv4 } from "uuid";
import isNil from "lodash/isNil";
import { LineLength, Medium, Point, Role } from "../types";
import { defaultGameSettings } from "../constants";

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

export const emitCreateRoomAndHost = (roomID: string, medium: Medium) => {
    socket.emit("ctsCreateRoomAndHost", roomID, medium);
};

export const emitJoinAs = (roomID: string, name: string, memberType: Role, isTest = false) => {
    console.log("emitJoinAs activated as", name, "is trying to join", roomID, "as", memberType);
    socket.emit("ctsJoinAs", roomID.toUpperCase(), name.toUpperCase(), memberType, isTest);
};

interface IGameSettings {
    lineLength?: LineLength;
    nPoems?: number;
    nRounds?: number;
    nDrawings?: number;
}
export const emitAlterGameSettings = (gameSettings: IGameSettings) => {
    socket.emit("ctsAlterGameSettings", gameSettings);
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

/* TODO: WE DON'T NEED THIS!??!?!
export const emitRequestLineEdit = () => {
    socket.emit("ctsRequestLineEdit");
};

export const emitRequestEditorActive = () => {
    socket.emit("ctsRequestEditorActive");
};

export const emitRequestLastLineStatus = () => {
    socket.emit("ctsRequestLastLineStatus");
};
*/

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
    console.log("emitRequestCanvas activated");
    socket.emit("ctsRequestCanvas");
};
