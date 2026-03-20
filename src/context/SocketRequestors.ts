import { socket } from "components/SocketHandler/SocketHandler";
import { isNil } from "helpers/helpers";
import type { IGameSettingsInfo, Medium, Point, Role } from "types/types";
import { logger } from "utilities/loggerUtils";

export const emitRecognizeDevice = () => {
    // set this to true if you want to be able to connect to the game
    // multiple times from the same browser
    if (import.meta.env.VITE_DEBUG_SINGLE_BROWSER === "true") {
        // to debug I will send a random device id each time
        socket.emit("ctsRecognizeDevice", crypto.randomUUID());
    } else {
        // check if this device (browser) has visited the page before
        const firstVisit = !localStorage.getItem("device");
        if (firstVisit) {
            localStorage.setItem("device", crypto.randomUUID());
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

// Testing
export const emitRequestPoemsLines = () => {
    socket.emit("ctsRequestPoemsLines");
};

// Testing
export const emitRequestDrawings = () => {
    socket.emit("ctsRequestDrawings");
};

export const emitCreateRoomAndHost = (roomID: string, medium: Medium) => {
    socket.emit("ctsCreateRoomAndHost", roomID, medium);
};

export const emitJoinAs = (roomID: string, name: string, memberType: Role, isTest = false) => {
    logger.debug(`emitJoinAs activated as ${name} is trying to join ${roomID} as ${memberType}`);
    socket.emit("ctsJoinAs", roomID.toUpperCase(), name.toUpperCase(), memberType, isTest);
};

export const emitAlterGameSettings = (gameSettings: Partial<IGameSettingsInfo>) => {
    socket.emit("ctsAlterGameSettings", gameSettings);
};

export const emitStartGame = () => {
    socket.emit("ctsStartGame");
};

export const emitAddPoemBot = () => {
    socket.emit("ctsAddPoemBot");
};

export const emitRequestSettingsEnabled = () => {
    socket.emit("ctsRequestSettingsEnabled"); // initial populate
};

export const emitRequestGameSettingsInfo = () => {
    socket.emit("ctsRequestGameSettingsInfo");
};

export const emitLeave = () => {
    socket.emit("ctsLeave");
};

export const emitEditLine = (value: string) => {
    socket.emit("ctsEditLine", value);
};

export const emitSendLineParts = (firstPart: string, secondPart: string) => {
    socket.emit("ctsSendLineParts", firstPart, secondPart);
};

export const emitSendLastLine = (value: string) => {
    socket.emit("ctsSendLastLine", value);
};

export const emitSendPanelEdit = (value: Point[][]) => {
    logger.debug(`sendPanelEdit: ${value}`);
    socket.emit("ctsSendPanelEdit", value);
};

export const emitSendPanel = (value: Point[][]) => {
    logger.debug(`sendCanvas: ${value}`);
    socket.emit("ctsSendPanel", value);
};

export const emitSendLastPanel = (value: Point[][]) => {
    socket.emit("ctsSendLastPanel", value);
};
