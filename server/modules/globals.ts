import type Host from "./host";
import { DrawingRoom, PoemRoom } from "./room";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "@socket.io/component-emitter";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";

export const socketIDToDeviceID: Record<string, string> = {};
export const deviceIDToSocketID: Record<string, string> = {}; // unique on device. only latest is present
export const deviceIDToRoomID: Record<string, string> = {};
export const roomIDToRoom: Map<string, PoemRoom | DrawingRoom> = new Map();
export const roomIDToHost: Map<string, Host> = new Map();

export const botDeviceIDToBotSocket: Map<string, Socket<DefaultEventsMap, DefaultEventsMap>> = new Map();
// possibly map both poem & bot ID to message history (history would be poem specific)
export const botDeviceIDToMessageHistory: Record<string, InMemoryChatMessageHistory> = {};
