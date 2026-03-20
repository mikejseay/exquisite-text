import { EventEmitter } from "node:events";

// Minimal mock for socket.io Server and Socket used throughout tests
export function createMockSocket(id = "socket-1") {
    const emitter = new EventEmitter();
    const rooms = new Set<string>();
    const socketEmissions: Array<{ target: string; event: string; args: any[] }> = [];
    return {
        id,
        join(room: string) {
            rooms.add(room);
        },
        leave(room: string) {
            rooms.delete(room);
        },
        rooms,
        on: emitter.on.bind(emitter),
        emit: emitter.emit.bind(emitter),
        removeAllListeners: emitter.removeAllListeners.bind(emitter),
        disconnect() {},
        socketEmissions,
        to(target: string) {
            return {
                emit(event: string, ...args: any[]) {
                    socketEmissions.push({ target, event, args });
                },
            };
        },
    } as any;
}

export function createMockIO() {
    const emissions: Array<{ target: string; event: string; args: any[] }> = [];
    const io: any = {
        emissions,
        in(room: string) {
            return {
                emit(event: string, ...args: any[]) {
                    emissions.push({ target: room, event, args });
                },
            };
        },
        to(socketId: string) {
            return {
                emit(event: string, ...args: any[]) {
                    emissions.push({ target: socketId, event, args });
                },
            };
        },
    };
    return io;
}
