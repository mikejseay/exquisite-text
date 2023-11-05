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
    ServerToClientEvents,
    SocketData,
} from "../../src/types";
import { maxEditors } from "../../src/constants";

import {
    deviceIDToRoomId,
    deviceIDToSocketID,
    roomIdToHost,
    roomIdToRoom,
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

        socket.on("recognizeDevice", (deviceID) => {
            console.log("new socket", socket.id, "from device", deviceID);

            const isDeviceInARoom: boolean = Object.prototype.hasOwnProperty.call(
                deviceIDToRoomId,
                deviceID,
            );
            if (isDeviceInARoom) {
                // try to reconnect them to that room in the correct role
                const roomId = deviceIDToRoomId[deviceID];
                const theRoom = roomIdToRoom.get(roomId);
                const editorDeviceIDsInRoom = Array.from(theRoom.editors.keys());
                const spectatorDeviceIDsInRoom = Array.from(theRoom.spectators.keys());

                let theMember;
                let targetView;
                if (editorDeviceIDsInRoom.includes(deviceID)) {
                    theMember = theRoom.editors.get(deviceID);
                    targetView = "/game";
                } else if (spectatorDeviceIDsInRoom.includes(deviceID)) {
                    theMember = theRoom.spectators.get(deviceID);
                    targetView = "/spectate";
                } else {
                    targetView = "/";
                }
                // if the socket is still connected, send them to disconnected view
                io.to(theMember.socket.id).emit("navigate", "/disconnected");
                theMember.socket.disconnect(); // force disconnect
                delete theMember.socket;
                theMember.socket = socket; // connect the new socket
                theMember.joinRoom(); // re-join the correct rooms
                // TODO: next big important piece: reinstate context on re-join
                // theMember.reinstateContext();  // something like this
                // theMember.setReceive(); // amazingly, this isn't necessary...
                io.to(socket.id).emit("navigate", targetView); // navigate to correct view
            } // else this device isn't in a room yet, nothing to do

            socketIDToDeviceID[socket.id] = deviceID; // since socket is always uuid, won't overwrite
            deviceIDToSocketID[deviceID] = socket.id; // will overwrite previous
        });

        socket.on("createGameHost", (roomId) => {
            console.log("createGameHost for ", socket.id, "joining", roomId);
            // notice we don't add the host device to deviceIDToRoomId
            const thisHost = new Host(
                io,
                socket,
                roomId,
                socketIDToDeviceID[socket.id],
                "HOST",
            );
            thisHost.joinRoom();
            roomIdToHost.set(roomId, thisHost);
            const thisRoom = new Room(io, socket, roomId);
            roomIdToRoom.set(roomId, thisRoom);
            console.log("room", roomId, "created with ", socket.id, "as host");
        });

        // TODO: role should be an enum
        socket.on("joinGameAs", (role, roomId, name) => {
            console.log(
                "socket",
                socket.id,
                "joinGameAs",
                role,
                "to room",
                roomId,
                "with name",
                name,
            );
            if (!roomIdToRoom.has(roomId)) {
                console.log(roomId, "does not exist");
                io.to(socket.id).emit("joinError", "Room does not exist.");
                return;
            }
            const targetRoom = roomIdToRoom.get(roomId);
            console.log("current state of socketIDToDeviceID is", socketIDToDeviceID);
            const deviceID = socketIDToDeviceID[socket.id];
            if (role === "Editor") {
                if (targetRoom.gameOngoing) {
                    console.log(roomId, "game is already ongoing");
                    io.to(socket.id).emit(
                        "joinError",
                        "Game already ongoing. Join as spectator?",
                    );
                    return;
                }
                if (targetRoom.editors.size >= maxEditors) {
                    console.log("trying to join as editor but it's already full");
                    io.to(socket.id).emit(
                        "joinError",
                        "Writer's room full. Join as spectator?",
                    );
                    return;
                }
                deviceIDToRoomId[deviceID] = roomId;
                console.log("about to make editor obj with deviceID", deviceID, "and name", name);
                const thisEditor = new Editor(io, socket, roomId, deviceID, name);
                console.log("editor object created with deviceID", thisEditor.deviceID);
                thisEditor.joinRoom();
                console.log("room joined");
                io.to(socket.id).emit("navigate", "/lobby");
                console.log("sent navigate message");
                // io.to(socket.id).emit("roomCode", roomId);
                // console.log("sent room code");
                targetRoom.addEditor(deviceID, thisEditor);
                console.log("editor added to room");
            } else if (role === "Spectator") {
                deviceIDToRoomId[deviceID] = roomId;
                const thisSpectator = new Spectator(io, socket, roomId, deviceID, name);
                thisSpectator.joinRoom();
                if (targetRoom.gameOngoing) {
                    io.to(socket.id).emit("navigate", "/spectate");
                } else {
                    io.to(socket.id).emit("navigate", "/lobby");
                    // io.to(socket.id).emit("roomCode", roomId);
                    // console.log("sent room code");
                }
                targetRoom.addSpectator(deviceID, thisSpectator);
            }
        });
    });
}

export default sockets;
