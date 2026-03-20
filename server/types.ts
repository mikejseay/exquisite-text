import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "shared/types/types";
import type { Server, Socket } from "socket.io";

export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
