import type { Key } from "react";
import type { NavigateFunction } from "react-router-dom";

export enum GameState {
    LOBBY = "Lobby",
    GAME = "Game",
    END = "End",
}

export enum Medium {
    ART = "Art",
    POETRY = "Poetry",
    DRAWING = "Drawing",
}

export enum Role {
    EDITOR = "Editor",
    SPECTATOR = "Spectator"
}

export enum LineLength {
    SHORT = "short",
    LONG = "long",
}

export interface ILineConstraints {
    minCharsOnLineOne: number;
    maxCharsOnLineOne: number;
    minCharsOnLineTwo: number;
    maxCharsOnLineTwo: number;
    idealCharsOnLineOne: number;
    idealCharsOnLineTwo: number;
    idealWordsOnLineOne: number;
    idealWordsOnLineTwo: number;
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
    nDrawings: number;
}

interface ICollaboration {
    id: Key;
    createdAt: Date;
    title: string;
}

export interface IPoem extends ICollaboration {
    content: string;
}

// TODO: Type guards
// function isPoem(obj: any): obj is Poem {
//     return "lines" in obj;
// }

// function isDrawing(obj: any): obj is Drawing {
//     return "panels" in obj;
// }

interface IContribution {
    ID: string;
    contributionIndex: number;
    authorDevice: string;
    passerDevice: string;
    addedAt: Date;
}

export interface ILine extends IContribution {
    content: string;
    editLength: number;
}

export interface IPanel extends IContribution {
    content: Point[][];
    hintSize: number;
}

/*  Levels

    Multiple Drawings - Point[][][][]
    Drawings          - Point[][][]
    Panels            - Point[][]
    Strokes           - Point[]

*/
export interface Point {
    x: number;
    y: number;
    lineWidth: number;
    color: string;
}

export interface ServerToClientEvents {
    stcLineEdit: (lineEdit: string) => void;
    stcDrawingPanel: (panel: IPanel) => void;
    stcPoemLines: (lines: ILine[]) => void;
    stcDrawingPanels: (panels: IPanel[]) => void;
    stcRoomCode: (roomCode: string) => void;
    stcJoinError: (errorMessage: string) => void;
    stcUserTableInfo: (userTableInfo: IUserTableInfo) => void;
    stcGameSettingsInfo: (gameSettings: IGameSettingsInfo) => void;
    stcGameSettingsEnabled: (enabled: boolean) => void;
    stcNavigate: (targetRoute: string) => void;
    stcEditorActive: (isActive: boolean) => void;
    stcLastContribution: (isLast: boolean) => void;
    stcLineEditorWatch: (lineEdit: string) => void;
    stcLineSpectator: (indexInGame: number, content: ILine["content"]) => void;
    stcPanelSpectator: (indexInGame: number, content: IPanel["content"]) => void;
    stcPanelEditSpectator: (indexInGame: number, content: IPanel["content"]) => void;
    stcLineEditSpectator: (poemIndex: number, lineEdit: string) => void;
    stcStrokeHistory: (strokeHistory: Point[][]) => void;
    stcCompletedDrawings: (completedDrawings: Point[][][][]) => void;
    stcMedium: (medium: Medium) => void;
}

export interface ClientToServerEvents {
    ctsRequestUserTableInfo: (shouldTest: boolean) => void;
    ctsRequestPoemsLines: () => void;
    ctsRequestDrawings: () => void;
    ctsRequestLineEdit: () => void;
    ctsEditLine: (value: string) => void;
    ctsRecognizeDevice: (deviceID: string) => void;
    ctsCreateRoomAndHost: (roomID: string, medium: Medium) => void;
    ctsJoinAs: (roomID: string, name: string, role: Role, isTest: boolean) => void;
    ctsJoinAsBot: (roomID: string, name: string, botDeviceID: string) => void;
    ctsRequestGameSettingsInfo: () => void;
    ctsRequestLastContributionStatus: () => void;
    ctsAlterGameSettings: (gameSettings: Partial<IGameSettingsInfo>) => void;
    ctsRequestSettingsEnabled: () => void;
    ctsStartGame: () => void;
    ctsAddPoemBot: () => void;
    ctsRequestEditorActive: () => void;
    ctsSendLineParts: (firstPart: string, secondPart: string) => void;
    ctsSendLastLine: (lastLine: string) => void;
    ctsSendLastPanel: (panelContent: Point[][]) => void;
    ctsLeave: () => void;
    ctsSendPanel: (panelContent: Point[][]) => void;
    ctsSendPanelEdit: (panelContent: Point[][]) => void;
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
    setNDrawings: (value: number |
        ((prevVar: number) => number)) => void;
    // React.useState<Array<Array<string>>>([ [], [], [], [] ]);
    setLines: (value: Array<Array<ILine["content"]>> |
        ((prevVar: Array<Array<string>>) => Array<Array<string>>)) => void;
    setPanels: (value: Array<Array<IPanel["content"]>> |
        ((prevVar: Array<Array<IPanel["content"]>>) => Array<Array<IPanel["content"]>>)) => void;
    setPanelEdits: (value: Array<IPanel["content"]> |
        ((prevVar: Array<IPanel["content"]>) => Array<IPanel["content"]>)) => void;
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
    setOnLastContribution: (value: boolean |
        ((prevVar: boolean) => boolean)) => void;
    // React.useState<boolean>(false);
    setEditorActive: (value: boolean |
        ((prevVar: boolean) => boolean)) => void;
        navigate: NavigateFunction;
    setStrokeHistory: (value: Point[][] |
        ((prevVar: Point[][]) => Point[][])) => void;
    setCompletedDrawings: (value: Point[][][][] |
        ((prevVar: Point[][][][]) => Point[][][][])) => void;
    setMedium: (medium: Medium |
        ((prevVar: Medium) => Medium)) => void;
}

export interface ISocketInfo {
    // agnostic
    editorActive: boolean | null;
    joinErrorMessage: string | null;
    roomCode: string | null;
    setRoomCode: (value: string | ((prevVar: string) => string)) => void;
    settingsEnabled: boolean | null;
    userInfo: IUserTableInfo | null;
    setEditorActive: (value: boolean | ((prevVar: boolean) => boolean)) => void;

    // poems
    lineEdits: Array<string> | null;
    lineLength: LineLength | null;
    lines: Array<Array<ILine["content"]>> | null;
    nPoems: number | null;
    nRounds: number | null;
    onLastContribution: boolean | null;
    poemInput: string | null;
    poemInputSpectate: string | null;
    poemsLines: Array<ILine[]> | null;
    setLineLength: (value: LineLength | ((prevVar: LineLength) => LineLength)) => void;
    setNPoems: (value: number | ((prevVar: number) => number)) => void;
    setNRounds: (value: number | ((prevVar: number) => number)) => void;
    setPoemInput: (value: string | ((prevVar: string) => string)) => void;

    // drawings
    panels: Array<Array<IPanel["content"]>> | null;
    panelEdits: Array<IPanel["content"]> | null;
    nDrawings: number | null;
    setNDrawings: (value: number | ((prevVar: number) => number)) => void;
    setStrokeHistory: (value: Point[][] | ((prevVar: Point[][]) => Point[][])) => void;
    strokeHistory: Point[][] | null;
    setCompletedDrawings: (value: Point[][][][] | ((prevVar: Point[][][][]) => Point[][][][])) => void;
    completedDrawings: Point[][][][] | null;
    medium: Medium | null;
    setMedium: (medium: Medium | ((prevVar: Medium) => Medium)) => void;
}
