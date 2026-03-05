// Handle lines passed between users and the server
// and using that content, we maintain the user list and current history of the poem.
// as far as I can tell, this will be the equivalent of the exquisite functionality, etc.

import Host from "./host";
import { DrawingEditor, PoemBot, PoemEditor } from "./editor";
import { DrawingSpectator, PoemSpectator } from "./spectator";
import { DrawingRoom, PoemRoom } from "./room";
import {
    GameState,
    Medium,
    Role,
} from "../../src/types";
import { maxEditors } from "../../src/constants";

import { deviceIDToRoomID, deviceIDToSocketID, roomIDToHost, roomIDToRoom, socketIDToDeviceID } from "./globals";
import { getRoom, getRouteForGameStateAndRole, standardReconnect } from "../utilities/socketUtils";
import { logger } from "../utilities/loggerUtils";
import type { TypedServer } from "../types";

// The module exports a single function poem that takes the Socket.IO server instance as a parameter.
function sockets(io: TypedServer) {
    // connection is a reserved name for a socket event when someone connects
    io.on("connection", (socket) => {
        // When a client requests a connection, the callback will create a new Connection instance
        // and pass the Socket.IO server instance and the new socket to the constructor.

        // This establishes the callbacks that every socket should have access to.

        socket.on("ctsRecognizeDevice", (deviceID) => {
            logger.debug(`new socket ${socket.id} from device ${deviceID}`);

            const isDeviceInARoom: boolean = Object.prototype.hasOwnProperty.call(
                deviceIDToRoomID,
                deviceID,
            );

            // if device not already in a room, add it to globals and exit
            if (!isDeviceInARoom) {
                logger.debug("device was not in a room");
                socketIDToDeviceID[socket.id] = deviceID; // since socket is always uuid, won't overwrite
                deviceIDToSocketID[deviceID] = socket.id; // will overwrite previous
                return;
            }

            // if already in a room, reconnect gracefully
            const roomID = deviceIDToRoomID[deviceID];
            const room = getRoom(roomID);
            if (!room) {
                logger.debug(`room ${roomID} not found while trying to recognize ${deviceID}`);
                return;
            }

            let role: Role;
            const editorDeviceIDsInRoom = Array.from(room.editors.keys());
            const spectatorDeviceIDsInRoom = Array.from(room.spectators.keys());
            if (editorDeviceIDsInRoom.includes(deviceID)) {
                role = Role.EDITOR;
            } else if (spectatorDeviceIDsInRoom.includes(deviceID)) {
                role = Role.SPECTATOR;
            } else {
                logger.debug(`role not identified when recognizing ${deviceID}`);
                return;
            }

            let member: PoemEditor | PoemSpectator | DrawingEditor | DrawingSpectator | undefined;
            if (role === Role.EDITOR) {
                member = room.editors.get(deviceID);
            } else if (role === Role.SPECTATOR) {
                member = room.spectators.get(deviceID);
            }
            if (!member) {
                logger.debug("member not found");
                return;
            }
            standardReconnect(io, socket, member);
            // If user disconnected while game was still in LOBBY, we removed them from the game.
            // If they reconnected before the game started, add them back to the game.
            if (room.gameState === GameState.LOBBY) {
                if (role === Role.EDITOR) {
                    room.addEditor(deviceID, member as PoemEditor | DrawingEditor);
                } else if (role === Role.SPECTATOR) {
                    room.addSpectator(deviceID, member as PoemSpectator | DrawingSpectator);
                }
            }
            const targetRoute = getRouteForGameStateAndRole(room.gameState, role);
            io.to(socket.id).emit("stcNavigate", targetRoute);
        });

        socket.on("ctsCreateRoomAndHost", (roomID: string, medium: Medium) => {
            logger.debug(`createGameHost for ${socket.id} joining ${roomID}`);
            // notice we don't add the host device to deviceIDToRoomID
            const host = new Host(
                io,
                socket,
                roomID,
                socketIDToDeviceID[socket.id],
                "HOST",
            );
            host.joinRoom();
            roomIDToHost.set(roomID, host);
            let room: PoemRoom | DrawingRoom | null = null;

            if (medium == Medium.POETRY) {
                room = new PoemRoom(io, socket, roomID);
            } else if (medium == Medium.DRAWING) {
                room = new DrawingRoom(io, socket, roomID);
            } else {
                throw new Error(`Unknown medium type: ${medium}`);
            }

            if (room) {
                roomIDToRoom.set(roomID, room);
            } else {
                throw new Error("Room not defined.");
            }
            logger.debug(`room ${roomID} created as medium ${medium} with ${socket.id} as host`);
        });

        socket.on("ctsJoinAs", (roomID: string, name: string, role: Role, isTest = false) => {
            logger.debug(`socket ${socket.id} ctsJoinAs ${role} to room ${roomID} with name ${name}`);
            if (!roomIDToRoom.has(roomID)) {
                logger.debug(`${roomID} does not exist`);
                io.to(socket.id).emit("stcJoinError", "Room does not exist.");
                return;
            }
            const room = getRoom(roomID);
            logger.debug(`current state of socketIDToDeviceID is ${socketIDToDeviceID}`);
            const deviceID = socketIDToDeviceID[socket.id];
            if (!room) {
                logger.debug("room not found");
                return;
            }
            if (role === Role.EDITOR) {
                if (room.gameState !== GameState.LOBBY) {
                    logger.debug(`${roomID} game already started`);
                    io.to(socket.id).emit(
                        "stcJoinError",
                        "Game already started. Join as spectator?",
                    );
                    return;
                }
                if (room.editors.size >= maxEditors) {
                    logger.debug("trying to join as editor but it's already full");
                    io.to(socket.id).emit(
                        "stcJoinError",
                        "Writer's room full. Join as spectator?",
                    );
                    return;
                }
                deviceIDToRoomID[deviceID] = roomID;
                logger.debug(`about to make editor obj with deviceID ${deviceID} and name ${name}`);

                let editor: PoemEditor | DrawingEditor | null = null;
                if (room.medium == Medium.POETRY) {
                    editor = new PoemEditor(io, socket, roomID, deviceID, name);

                } else if (room.medium == Medium.DRAWING) {
                    editor = new DrawingEditor(io, socket, roomID, deviceID, name);
                } else {
                    throw new Error("Unknown medium type.");
                }

                io.to(socket.id).emit("stcMedium", room.medium);

                logger.debug(`editor object created with deviceID ${editor.deviceID}`);
                editor.joinRoom();
                // If *joining* a game as an editor, the only possibility is the lobby
                if (!isTest) {
                    io.to(socket.id).emit("stcNavigate", "/lobby");
                }
                room.addEditor(deviceID, editor);

            } else if (role === Role.SPECTATOR) {
                deviceIDToRoomID[deviceID] = roomID;
                let spectator: PoemSpectator | DrawingSpectator | null = null;

                if (room.medium == Medium.POETRY) {
                    spectator = new PoemSpectator(io, socket, roomID, deviceID, name);
                } else if (room.medium == Medium.DRAWING) {
                    spectator = new DrawingSpectator(io, socket, roomID, deviceID, name);
                } else {
                    throw new Error("Unknown medium type.");
                }

                logger.debug(`spectator object created with deviceID ${spectator.deviceID}`);
                spectator.joinRoom();
                // If joining a game as spectator, we can go to any screen
                if (!isTest) {
                    const targetRoute = getRouteForGameStateAndRole(room.gameState, Role.SPECTATOR);
                    logger.debug(`navigating spectator to ${targetRoute}`);
                    io.to(socket.id).emit("stcNavigate", targetRoute);
                }
                room.addSpectator(deviceID, spectator);
            }
        });

        socket.on("ctsJoinAsBot", (roomID: string, name: string, botDeviceID: string) => {
            logger.debug(`new socket ${socket.id} from bot with device ${botDeviceID}`);
            socketIDToDeviceID[socket.id] = botDeviceID;
            deviceIDToSocketID[botDeviceID] = socket.id;
            logger.debug(`socket ${socket.id} ctsJoinAsBot (as editor) to room ${roomID} with name ${name}`);
            const room = getRoom(roomID);
            logger.debug(`current state of socketIDToDeviceID is ${socketIDToDeviceID}`);
            if (!room) {
                logger.debug("room not found");
                return;
            }
            deviceIDToRoomID[botDeviceID] = roomID;
            logger.debug(`about to make bot editor obj with botDeviceID ${botDeviceID} and name ${name}`);

            const bot = new PoemBot(io, socket, roomID, botDeviceID, name);
            logger.debug(`bot object (for poems) created with botDeviceID ${bot.deviceID}`);
            bot.joinRoom();
            room.addEditor(botDeviceID, bot);
        });
    });
}

export default sockets;
