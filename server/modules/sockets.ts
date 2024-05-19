// Handle lines passed between users and the server
// and using that content, we maintain the user list and current history of the poem.
// as far as I can tell, this will be the equivalent of the exquisite functionality, etc.

import { Server } from "socket.io";

import Host from "./host";
import { DrawingEditor, PoemEditor } from "./editor";
import { DrawingSpectator, PoemSpectator } from "./spectator";
import { DrawingRoom, PoemRoom } from "./room";
import {
    ClientToServerEvents,
    GameState,
    InterServerEvents,
    Medium,
    Role,
    ServerToClientEvents,
    SocketData,
} from "../../src/types";
import { maxEditors } from "../../src/constants";

import { deviceIDToRoomID, deviceIDToSocketID, roomIDToHost, roomIDToRoom, socketIDToDeviceID } from "./globals";
import { getRoom, getRouteForGameStateAndRole, standardReconnect } from "../utilities/sockets";

// The module exports a single function poem that takes the Socket.IO server instance as a parameter.
function sockets(
    io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >,
) {
    // connection is a reserved name for a socket event when someone connects
    io.on("connection", (socket) => {
    // When a client requests a connection, the callback will create a new Connection instance
    // and pass the Socket.IO server instance and the new socket to the constructor.

        // This establishes the callbacks that every socket should have access to.

        socket.on("ctsRecognizeDevice", (deviceID) => {
            console.log("new socket", socket.id, "from device", deviceID);

            const isDeviceInARoom: boolean = Object.prototype.hasOwnProperty.call(
                deviceIDToRoomID,
                deviceID,
            );

            // if device not already in a room, add it to globals and exit
            if (!isDeviceInARoom) {
                console.log("device was not in a room");
                socketIDToDeviceID[socket.id] = deviceID; // since socket is always uuid, won't overwrite
                deviceIDToSocketID[deviceID] = socket.id; // will overwrite previous
                return;
            }

            // if already in a room, reconnect gracefully
            const roomID = deviceIDToRoomID[deviceID];
            const theRoom = getRoom(roomID);
            if (!theRoom) {
                console.log("theRoom", roomID, "not found while trying to recognize", deviceID);
                return;
            }

            let theRole: Role;
            const editorDeviceIDsInRoom = Array.from(theRoom.editors.keys());
            const spectatorDeviceIDsInRoom = Array.from(theRoom.spectators.keys());
            if (editorDeviceIDsInRoom.includes(deviceID)) {
                theRole = Role.EDITOR;
            } else if (spectatorDeviceIDsInRoom.includes(deviceID)) {
                theRole = Role.SPECTATOR;
            } else {
                console.log("role not identified when recognizing", deviceID);
                return;
            }

            let theMember: PoemEditor | PoemSpectator | DrawingEditor | DrawingSpectator | undefined;
            if (theRole === Role.EDITOR) {
                theMember = theRoom.editors.get(deviceID);
            } else if (theRole === Role.SPECTATOR) {
                theMember = theRoom.spectators.get(deviceID);
            }
            if (!theMember) {
                console.log("theMember not found");
                return;
            }
            standardReconnect(io, socket, theMember);
            // If user disconnected while game was still in LOBBY, we removed them from the game.
            // If they reconnected before the game started, add them back to the game.
            if (theRoom.gameState === GameState.LOBBY) {
                if (theRole === Role.EDITOR) {
                    theRoom.addEditor(deviceID, theMember as PoemEditor | DrawingEditor);
                } else if (theRole === Role.SPECTATOR) {
                    theRoom.addSpectator(deviceID, theMember as PoemSpectator | DrawingSpectator);
                }
            }
            const targetRoute = getRouteForGameStateAndRole(theRoom.gameState, theRole);
            io.to(socket.id).emit("stcNavigate", targetRoute);
        });

        socket.on("ctsCreateRoomAndHost", (roomID: string, medium: Medium) => {
            console.log("createGameHost for ", socket.id, "joining", roomID);
            // notice we don't add the host device to deviceIDToRoomID
            const thisHost = new Host(
                io,
                socket,
                roomID,
                socketIDToDeviceID[socket.id],
                "HOST",
            );
            thisHost.joinRoom();
            roomIDToHost.set(roomID, thisHost);
            let thisRoom: PoemRoom | DrawingRoom | null = null;

            if (medium == Medium.POETRY) {
                thisRoom = new PoemRoom(io, socket, roomID);
            } else if (medium == Medium.DRAWING) {
                thisRoom = new DrawingRoom(io, socket, roomID);
            } else {
                throw new Error("Unknown medium type.");
            }

            if (thisRoom) {
                roomIDToRoom.set(roomID, thisRoom);
            } else {
                throw new Error("Room not defined.");
            }
            console.log("room", roomID, "created as medium", medium, " with ", socket.id, "as host");
        });

        socket.on("ctsJoinAs", (roomID: string, name: string, role: Role, isTest = false) => {
            console.log(
                "socket",
                socket.id,
                "ctsJoinAs",
                role,
                "to room",
                roomID,
                "with name",
                name,
            );
            if (!roomIDToRoom.has(roomID)) {
                console.log(roomID, "does not exist");
                io.to(socket.id).emit("stcJoinError", "Room does not exist.");
                return;
            }
            const targetRoom = roomIDToRoom.get(roomID);
            console.log("current state of socketIDToDeviceID is", socketIDToDeviceID);
            const deviceID = socketIDToDeviceID[socket.id];
            if (!targetRoom) {
                console.log("targetRoom not found");
                return;
            }
            if (role === Role.EDITOR) {
                if (targetRoom.gameState !== GameState.LOBBY) {
                    console.log(roomID, "game already started");
                    io.to(socket.id).emit(
                        "stcJoinError",
                        "Game already started. Join as spectator?",
                    );
                    return;
                }
                if (targetRoom.editors.size >= maxEditors) {
                    console.log("trying to join as editor but it's already full");
                    io.to(socket.id).emit(
                        "stcJoinError",
                        "Writer's room full. Join as spectator?",
                    );
                    return;
                }
                deviceIDToRoomID[deviceID] = roomID;
                console.log("about to make editor obj with deviceID", deviceID, "and name", name);

                let thisEditor: PoemEditor | DrawingEditor | null = null;
                if (targetRoom.medium == Medium.POETRY) {
                    thisEditor = new PoemEditor(io, socket, roomID, deviceID, name);
                } else if (targetRoom.medium == Medium.DRAWING) {
                    thisEditor = new DrawingEditor(io, socket, roomID, deviceID, name);
                } else {
                    throw new Error("Unknown medium type.");
                }

                console.log("editor object created with deviceID", thisEditor.deviceID);
                thisEditor.joinRoom();
                // If *joining* a game as an editor, the only possibility is the lobby
                if (!isTest) {
                    io.to(socket.id).emit("stcNavigate", "/lobby");
                }
                targetRoom.addEditor(deviceID, thisEditor);

            } else if (role === Role.SPECTATOR) {
                deviceIDToRoomID[deviceID] = roomID;
                let thisSpectator: PoemSpectator | DrawingSpectator | null = null;

                if (targetRoom.medium == Medium.POETRY) {
                    thisSpectator = new PoemSpectator(io, socket, roomID, deviceID, name);
                } else if (targetRoom.medium == Medium.DRAWING) {
                    thisSpectator = new DrawingSpectator(io, socket, roomID, deviceID, name);
                } else {
                    throw new Error("Unknown medium type.");
                }

                console.log("spectator object created with deviceID", thisSpectator.deviceID);
                thisSpectator.joinRoom();
                // If joining a game as spectator, we can go to any screen
                if (!isTest) {
                    const targetRoute = getRouteForGameStateAndRole(targetRoom.gameState, Role.SPECTATOR);
                    console.log("navigating spectator to", targetRoute);
                    io.to(socket.id).emit("stcNavigate", targetRoute);
                }
                targetRoom.addSpectator(deviceID, thisSpectator);
            }
        });
    });
}

export default sockets;
