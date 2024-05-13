// Handle lines passed between users and the server
// and using that content, we maintain the user list and current history of the poem.
// as far as I can tell, this will be the equivalent of the exquisite functionality, etc.

import { Server } from "socket.io";

import Host from "./host";
import Editor from "./editor";
import Spectator from "./spectator";
import Room from "./room";
import {
    ClientToServerEvents,
    InterServerEvents,
    Role,
    ServerToClientEvents,
    SocketData,
} from "../../src/types";
import { maxEditors } from "../../src/constants";

import {
    deviceIDToRoomID,
    deviceIDToSocketID,
    roomIDToHost,
    roomIDToRoom,
    socketIDToDeviceID,
} from "./globals";

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
            if (isDeviceInARoom) {
                // try to reconnect them to that room in the correct role
                const roomID = deviceIDToRoomID[deviceID];
                const theRoom = roomIDToRoom.get(roomID);
                if (!theRoom) {
                    console.log("theRoom not found");
                    return;
                }
                const editorDeviceIDsInRoom = Array.from(theRoom.editors.keys());
                const spectatorDeviceIDsInRoom = Array.from(theRoom.spectators.keys());

                let theMember: Editor | Spectator | undefined;
                let targetView: string;
                if (editorDeviceIDsInRoom.includes(deviceID)) {
                    theMember = theRoom.editors.get(deviceID);
                    targetView = "/game";
                } else if (spectatorDeviceIDsInRoom.includes(deviceID)) {
                    theMember = theRoom.spectators.get(deviceID);
                    targetView = "/spectate";
                } else {
                    targetView = "/";
                }

                if (theMember && theMember.socket) {
                // if the socket is still connected, send them to disconnected view
                    io.to(theMember.socket.id).emit("stcNavigate", "/disconnected");
                    theMember.socket.disconnect(); // force disconnect
                    theMember.socket = socket; // connect the new socket
                    theMember.joinRoom(); // re-join the correct rooms
                    // TODO: next big important piece: reinstate context on re-join
                    theMember.reinstateContext();  // something like this
                // theMember.setReceive(); // amazingly, this isn't necessary...
                }

                io.to(socket.id).emit("stcNavigate", targetView); // navigate to correct view
            } // else this device isn't in a room yet, nothing to do

            socketIDToDeviceID[socket.id] = deviceID; // since socket is always uuid, won't overwrite
            deviceIDToSocketID[deviceID] = socket.id; // will overwrite previous
        });

        socket.on("ctsCreateGameHost", (roomID) => {
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
            const thisRoom = new Room(io, socket, roomID);
            roomIDToRoom.set(roomID, thisRoom);
            console.log("room", roomID, "created with ", socket.id, "as host");
        });

        socket.on("ctsJoinAs", (role: Role, roomID: string, name: string, isTest = false) => {
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
                const thisEditor = new Editor(io, socket, roomID, deviceID, name);
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
            } else if (role === Role.SPECTATOR) {
                deviceIDToRoomID[deviceID] = roomID;
                const thisSpectator = new Spectator(io, socket, roomID, deviceID, name);
                thisSpectator.joinRoom();
                if (!isTest) {
                    if (targetRoom.gameOngoing) {
                        io.to(socket.id).emit("stcNavigate", "/spectate");
                    } else {
                        io.to(socket.id).emit("stcNavigate", "/lobby");
                        // io.to(socket.id).emit("stcRoomCode", roomID);
                        // console.log("sent room code");
                    }
                }
                targetRoom.addSpectator(deviceID, thisSpectator);
            }
        });
    });
}

export default sockets;
