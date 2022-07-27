import { Key } from "react";

export enum Role {
  activeEditor = "activeEditor",
  inactiveEditor = "inactiveEditor",
  spectator = "spectator",
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
  userInfo: (a: IUserInfo) => void;
  allUserInfo: (a: Array<IUserInfo>) => void;
  line: (a: ILine) => void;
  lineEdit: (a: string) => void;
  poem: (a: IPoem) => void;
}

export interface ClientToServerEvents {
  sendUserInfo: () => void;
  sendAllUserInfoToAll: () => void;
  getLineEdit: () => void;
  lineEdit: (a: string) => void;
  line: (a: string) => void;
  allTurns: () => void;
  sendEachUserTheirInfo: () => void;
  poemDone: () => void;
  clearLines: () => void;
  getLines: () => void;
  getPoems: () => void;
}

export interface InterServerEvents {
}

export interface SocketData {
}
