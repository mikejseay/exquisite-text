import type Host from "./host";
import { PoemRoom } from "./room";

export const socketIDToDeviceID: Record<string, string> = {};
export const deviceIDToSocketID: Record<string, string> = {}; // unique on device. only latest is present
export const deviceIDToRoomID: Record<string, string> = {};
export const roomIDToRoom: Map<string, PoemRoom> = new Map();
export const roomIDToHost: Map<string, Host> = new Map();
