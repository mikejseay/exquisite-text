import { createContext, useContext } from "react";
import { ISocketInfo } from "../types";

export const SocketInfoContext = createContext<ISocketInfo>({
    // agnostic
    editorActive: null,
    joinErrorMessage: null,
    roomCode: null,
    setRoomCode: () => null,
    settingsEnabled: null,
    userInfo: null,
    setEditorActive: () => null,

    // poems
    lineEdits: null,
    lineLength: null,
    lines: null,
    nPoems: null,
    nRounds: null,
    onLastContribution: null,
    poemInput: null,
    poemInputSpectate: null,
    poemsLines: null,
    setLineLength: () => null,
    setNPoems: () => null,
    setNRounds: () => null,
    setPoemInput: () => null,

    // drawings
    panels: null,
    nDrawings: null,
    setNDrawings: () => null,
    setStrokeHistory: () => null,
    strokeHistory: null,
    setCompletedDrawings: () => null,
    completedDrawings: null,
    medium: null,
    setMedium: () => null,
});

export const useSocketInfo = (): ISocketInfo => {
    return useContext(SocketInfoContext);
};
