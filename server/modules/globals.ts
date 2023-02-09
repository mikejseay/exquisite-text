import type Host from "./host";

export const socketIDToDeviceID: Record<string, string> = {};
export const deviceIDToSocketID: Record<string, string> = {}; // unique on device. only latest is present
export const deviceIDToRoomId: Record<string, string> = {};
export const roomIdToRoom: Map<string, any> = new Map();
export const roomIdToHost: Map<string, Host> = new Map();
