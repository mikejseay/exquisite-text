import type Host from "./host";
import { DrawingRoom, PoemRoom } from "./room";

export const socketIDToDeviceID: Record<string, string> = {};
export const deviceIDToSocketID: Record<string, string> = {}; // unique on device. only latest is present
export const deviceIDToRoomID: Record<string, string> = {};
export const roomIDToRoom: Map<string, PoemRoom | DrawingRoom> = new Map();
export const roomIDToHost: Map<string, Host> = new Map();
