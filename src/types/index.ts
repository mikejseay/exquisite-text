import type { Key } from "react";
import type { NavigateFunction } from "react-router-dom";

export enum Role {
    EDITOR = "Editor",
    SPECTATOR = "Spectator"
}

export enum LineLength {
    short = "short",
    long = "long",
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
    editorColorMap: Record<string, string>;
    editorColors: Array<string>;
}

export interface IGameSettingsInfo {
    lineLength: LineLength;
    nRounds: number;
    nPoems: number;
}

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
    ID: string;
    lineIndex: number;
    content: string;
    authorDevice: string;
    passerDevice: string;
    editLength: number;
    addedAt: Date;
}

export interface Point {
    x: number;
    y: number;
    lineWidth: number;
  }

interface CanvasHistory {
    user: string;
    strokeHistory: Point[][]
}

export interface ServerToClientEvents {
    stcLineEdit: (a: string) => void;
    stcPoemLines: (a: ILine[]) => void;
    stcRoomCode: (a: string) => void;
    stcJoinError: (a: string) => void;
    stcUserTableInfo: (a: IUserTableInfo) => void;
    stcGameSettingsInfo: (a: IGameSettingsInfo) => void;
    stcGameSettingsEnabled: (a: boolean) => void;
    stcNavigate: (a: string) => void;
    stcEditorActive: (a: boolean) => void;
    stcLastLine: (a: boolean) => void;
    stcLineEditorWatch: (a: string) => void;
    stcLineSpectator: (a: number, b: string) => void;
    stcLineEditSpectator: (a: number, b: string) => void;
    stcStrokeHistory: (a: Point[][]) => void;
}

export interface ClientToServerEvents {
    ctsRequestUserTableInfo: (a: boolean) => void;
    ctsRequestPoemsLines: (a: boolean) => void;
    ctsRequestLineEdit: () => void;
    ctsEditLine: (a: string) => void;
    ctsRecognizeDevice: (a: string) => void;
    ctsCreateGameHost: (a: string) => void;
    ctsJoinAs: (role: Role, roomID: string, name: string) => void;
    ctsRequestGameSettingsInfo: () => void;
    ctsRequestLastLineStatus: () => void;
    ctsAlterGameSettings: (a: IGameSettingsInfo) => void;
    ctsRequestSettingsEnabled: () => void;
    ctsStartGame: () => void;
    ctsRequestEditorActive: () => void;
    ctsSendLineParts: (a: string, b: string) => void;
    ctsSendLastLine: (a: string) => void;
    ctsLeave: () => void;
    ctsSendCanvas: (a: Point[][]) => void;
    ctsRequestCanvas: () => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    name: string;
}

export interface ISocketInfoListeners {
    // React.useState<IUserTableInfo>({} as IUserTableInfo);
    setUserInfo: (value: IUserTableInfo |
        ((prevVar: IUserTableInfo) => IUserTableInfo)) => void;
    // React.useState<Array<ILine[]>>([]);
    setPoemsLines: (value: Array<ILine[]> |
        ((prevVar: Array<ILine[]>) => Array<ILine[]>)) => void;
    // React.useState<string>("");
    setJoinErrorMessage: (value: string |
        ((prevVar: string) => string)) => void;
    // React.useState<string>("");
    setRoomCode: (value: string |
        ((prevVar: string) => string)) => void;
    // React.useState<boolean>(false);
    setSettingsEnabled: (value: boolean |
        ((prevVar: boolean) => boolean)) => void;
    // React.useState<LineLength>(defaultGameSettings.lineLength);
    setLineLength: (value: LineLength |
        ((prevVar: LineLength) => LineLength)) => void;
    // React.useState<number>(defaultGameSettings.nRounds);
    setNRounds: (value: number |
        ((prevVar: number) => number)) => void;
    // React.useState<number>(defaultGameSettings.nPoems);
    setNPoems: (value: number |
        ((prevVar: number) => number)) => void;
    // React.useState<Array<Array<string>>>([ [], [], [], [] ]);
    setLines: (value: Array<Array<string>> |
        ((prevVar: Array<Array<string>>) => Array<Array<string>>)) => void;
    // React.useState<Array<string>>([ "", "", "", "" ]);
    setLineEdits: (value: Array<string> |
        ((prevVar: Array<string>) => Array<string>)) => void;
    // React.useState<string>("");
    setPoemInput: (value: string |
        ((prevVar: string) => string)) => void;
    // React.useState<string>("");
    setPoemInputSpectate: (value: string |
        ((prevVar: string) => string)) => void;
    // React.useState<boolean>(false);
    setOnLastLine: (value: boolean |
        ((prevVar: boolean) => boolean)) => void;
    // React.useState<boolean>(false);
    setEditorActive: (value: boolean |
        ((prevVar: boolean) => boolean)) => void;
        navigate: NavigateFunction;
    setStrokeHistory: (value: Point[][] |
        ((prevVar: Point[][]) => Point[][])) => void;
}

export interface ISocketInfo {
    userInfo: IUserTableInfo | null;
    poemsLines: Array<ILine[]> | null;
    joinErrorMessage: string | null;
    roomCode: string | null;
    setRoomCode: (value: string |
        ((prevVar: string) => string)) => void;
    settingsEnabled: boolean | null;
    lineLength: LineLength | null;
    nRounds: number | null;
    nPoems: number | null;
    setLineLength: (value: LineLength |
        ((prevVar: LineLength) => LineLength)) => void;
    setNRounds: (value: number |
        ((prevVar: number) => number)) => void;
    setNPoems: (value: number |
        ((prevVar: number) => number)) => void;
    lines: Array<Array<string>> | null;
    lineEdits: Array<string> | null;
    poemInput: string | null;
    poemInputSpectate: string | null;
    onLastLine: boolean | null;
    editorActive: boolean | null;
    setPoemInput: (value: string |
        ((prevVar: string) => string)) => void;
    strokeHistory: Point[][] | null;
    setStrokeHistory: (value: Point[][] |
        ((prevVar: Point[][]) => Point[][])) => void;
}
