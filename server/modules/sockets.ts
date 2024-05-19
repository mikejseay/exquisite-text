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
    InterServerEvents,
    Medium,
    Role,
    ServerToClientEvents,
    SocketData,
} from "../../src/types";
import { maxEditors } from "../../src/constants";

import { deviceIDToRoomID, deviceIDToSocketID, roomIDToHost, roomIDToRoom, socketIDToDeviceID } from "./globals";
import { getRoom, reconnectRoutine } from "../utilities/sockets";

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
            const editorDeviceIDsInRoom = Array.from(theRoom.editors.keys());
            const spectatorDeviceIDsInRoom = Array.from(theRoom.spectators.keys());
            const isEditor = editorDeviceIDsInRoom.includes(deviceID);
            const isSpectator = spectatorDeviceIDsInRoom.includes(deviceID);
            let theMember: PoemEditor | PoemSpectator | DrawingEditor | DrawingSpectator | undefined;
            if (isEditor) {
                theMember = theRoom.editors.get(deviceID);
            } else if (isSpectator) {
                theMember = theRoom.spectators.get(deviceID);
            }
            if (!theMember) {
                console.log("theMember not found");
                return;
            }
            reconnectRoutine(io, socket, theMember);
            if (theRoom.gameOngoing) {
                io.to(socket.id).emit("stcNavigate", "/game");
            } else {
                if (isEditor) {
                    theRoom.addEditor(deviceID, theMember as PoemEditor | DrawingEditor);
                } else if (isSpectator) {
                    theRoom.addSpectator(deviceID, theMember as PoemSpectator | DrawingSpectator);
                }
                io.to(socket.id).emit("stcNavigate", "/lobby");
            }
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
                if (targetRoom.gameOngoing) {
                    console.log(roomID, "game is already ongoing");
                    io.to(socket.id).emit(
                        "stcJoinError",
                        "Game already ongoing. Join as spectator?",
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

                if (thisEditor) {
                    console.log("editor object created with deviceID", thisEditor.deviceID);
                    thisEditor.joinRoom();
                    console.log("room joined");
                    if (!isTest) {
                        io.to(socket.id).emit("stcNavigate", "/lobby");
                    }
                    console.log("sent navigate message");
                    // io.to(socket.id).emit("stcRoomCode", roomID);
                    // console.log("sent room code");
                    targetRoom.addEditor(deviceID, thisEditor);
                    console.log("editor added to room");
                } else {
                    throw new Error("Editor not defined.");
                }
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

                if (thisSpectator) {
                    console.log("spectator object created with deviceID", thisSpectator.deviceID);
                    thisSpectator.joinRoom();
                    console.log("room joined");
                    if (!isTest) {
                        if (targetRoom.gameOngoing) {
                            io.to(socket.id).emit("stcNavigate", "/spectate");
                        } else {
                            io.to(socket.id).emit("stcNavigate", "/lobby");
                        }
                    }
                    console.log("sent navigate message");
                    targetRoom.addSpectator(deviceID, thisSpectator);
                    console.log("editor added to room");
                } else {
                    throw new Error("Spectator not defined.");
                }
            }
        });
    });
}

export default sockets;
