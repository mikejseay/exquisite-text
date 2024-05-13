import type Host from "./host";
import Room from "./room";

export const socketIDToDeviceID: Record<string, string> = {};
export const deviceIDToSocketID: Record<string, string> = {}; // unique on device. only latest is present
export const deviceIDToRoomID: Record<string, string> = {};
export const roomIDToRoom: Map<string, Room> = new Map();
export const roomIDToHost: Map<string, Host> = new Map();
