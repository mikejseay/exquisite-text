import { Key } from "react";

export enum Role {
  activeEditor = "activeEditor",
  inactiveEditor = "inactiveEditor",
  spectator = "spectator",
}

export interface IUserTableInfo {
  editors: Array<string>;
  spectators: Array<string>;
}

export interface IGameSettingsInfo {
  lineLength: string;
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

export interface ILines {
  [id: string]: ILine;
}

export interface ILine {
  id: Key;
  user: IUserInfo;
  value: string;
  createdAt: Date;
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

export interface ServerToClientEvents {
  clearLines: () => void;
  line: (a: ILine) => void;
  lineEdit: (a: string) => void;
  poem: (a: IPoem) => void;

  joinError: (a: string) => void;
  editorJoinSuccess: () => void;
  spectatorJoinSuccess: () => void;
  userTableInfo: (a: IUserTableInfo) => void;
  gameSettingsInfo: (a: IGameSettingsInfo) => void;
  gameSettingsEnabled: (a: boolean) => void;
  enactStartGame: () => void;
  sendRole: (a: string) => void;
  receiveEditorActive: (a: boolean) => void;
  checkIfActive: () => void;

}

export interface ClientToServerEvents {
  getLineEdit: () => void;
  lineEdit: (a: string) => void;
  line: (a: string) => void;
  poemDone: () => void;
  clearLines: () => void;
  getLines: () => void;
  getPoems: () => void;

  recognizeDevice: (a: string | null) => void;
  createGameHost: (a: string) => void;
  joinGameEditor: (a: string, b: string) => void;
  joinGameSpectator: (a: string, b: string) => void;
  getUserTableInfo: () => void;
  getGameSettingsInfo: () => void;
  alterGameSettings: (a: IGameSettingsInfo) => void;
  getSettingsEnabled: () => void;
  startGame: () => void;
  getRole: () => void;
  getEditorActive: () => void;
  editorsDefineTurns: () => void;
  passTurn: (a: string, b: string) => void;
  lastLine: (a: string) => void;
}

export interface InterServerEvents {
}

export interface SocketData {
}
