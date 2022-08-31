import { Key } from "react";

export enum Role {
    activeEditor = "activeEditor",
    inactiveEditor = "inactiveEditor",
    // spectator = "spectator",
}

export enum LineLength {
    short = "short",
    long = "long",
}

export interface INode {
    id: number,
    label: string,
    color: string,
}

export interface IEdge {
    from: number,
    to: number,
}

export interface IGraph {
    nodes: INode[],
    edges: IEdge[],
}

export interface ILineConstraints {
    minCharsOnLineOne: number;
    maxCharsOnLineOne: number;
    minCharsOnLineTwo: number;
    maxCharsOnLineTwo: number;
    idealCharsOnLineOne: number;
    idealCharsOnLineTwo: number;
}

export type ILineConstraintDict = {
    [key in LineLength]: ILineConstraints;
}

export interface IUserTableInfo {
    editors: Array<string>;
    spectators: Array<string>;
    editorColors: Record<string, string>;
}

export interface IGameSettingsInfo {
    lineLength: LineLength;
    nRounds: number;
    nPoems: number;
}

export interface IUserInfo {
    id: string;
    name: string;
    color: string;
    turn: number;
    role: Role;
    turnsAway: number;
}

// export interface ILine {
//     id: Key;
//     user: IUserInfo;
//     value: string;
//     createdAt: Date;
// }

export interface IPoems {
    [id: string]: IPoem;
}

export interface IPoem {
    id: Key;
    content: string;
    createdAt: Date;
    title: string;
}

export interface ILine {
    poemID: string;
    lineIndex: number;
    content: string;
    authorDevice: string;
    passerDevice: string;
    editLength: number;
    addedAt: Date;
}

export interface ServerToClientEvents {
    // line: (a: ILine) => void;
    lineEdit: (a: string) => void;
    lineEditSize: (a: number, b: number) => void;
    poem: (a: IPoem) => void;
    poemLines: (a: ILine[]) => void;

    joinError: (a: string) => void;
    joinSuccess: () => void;
    userTableInfo: (a: IUserTableInfo) => void;
    gameSettingsInfo: (a: IGameSettingsInfo) => void;
    gameSettingsEnabled: (a: boolean) => void;
    navigate: (a: string) => void;
    editorActive: (a: boolean) => void;
    lastLine: (a: boolean) => void;
    checkIfActive: () => void;
    lineEditorWatch: (a: string) => void;
    lineSpectator: (a: number, b: string) => void;
    lineEditSpectator: (a: number, b: string) => void;
}

export interface ClientToServerEvents {
    getLineEdit: () => void;
    lineEdit: (a: string) => void;
    line: (a: string) => void;
    poemDone: () => void;
    getLines: () => void;
    getPoems: () => void;
    getPoemLines: () => void;
    recognizeDevice: (a: string) => void;
    createGameHost: (a: string) => void;
    joinGameAs: (a: string, b: string, c: string) => void;
    getUserTableInfo: () => void;
    getGameSettingsInfo: () => void;
    getLastLineStatus: () => void;
    alterGameSettings: (a: IGameSettingsInfo) => void;
    getSettingsEnabled: () => void;
    startGame: () => void;
    getEditorActive: () => void;
    passTurn: (a: string, b: string) => void;
    lastLine: (a: string) => void;
    leave: () => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    name: string;
}
