import type { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import type { DefaultEventsMap } from "@socket.io/component-emitter";
import type Host from "modules/host";
import type { DrawingRoom, PoemRoom } from "modules/room";
import type { Socket } from "socket.io-client";

export const socketIDToDeviceID: Record<string, string> = {};
export const deviceIDToSocketID: Record<string, string> = {}; // unique on device. only latest is present
export const deviceIDToRoomID: Record<string, string> = {};
export const roomIDToRoom: Map<string, PoemRoom | DrawingRoom> = new Map();
export const roomIDToHost: Map<string, Host> = new Map();

export const botDeviceIDToBotSocket: Map<string, Socket<DefaultEventsMap, DefaultEventsMap>> = new Map();
// possibly map both poem & bot ID to message history (history would be poem specific)
export const botDeviceIDToMessageHistory: Record<string, InMemoryChatMessageHistory> = {};
