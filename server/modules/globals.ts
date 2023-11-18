import type Host from "./host";
import Room from "./room";

export const socketIDToDeviceID: Record<string, string> = {};
export const deviceIDToSocketID: Record<string, string> = {}; // unique on device. only latest is present
export const deviceIDToRoomId: Record<string, string> = {};
export const roomIdToRoom: Map<string, Room> = new Map();
export const roomIdToHost: Map<string, Host> = new Map();
