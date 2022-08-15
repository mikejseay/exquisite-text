// Handle lines passed between users and the server
// and using that content, we maintain the user list and current history of the poem.
// as far as I can tell, this will be the equivalent of the exquisite functionality, etc.

import isNil from "lodash/isNil";
import {
    Server,
    Socket,
} from "socket.io";
import { v4 as uuidv4 } from "uuid"; // a function that generates a random uuid for lines

import {
    ClientToServerEvents,
    IGameSettingsInfo,
    InterServerEvents,
    IObjectStringToString,
    IPoem,
    LineLength,
    ServerToClientEvents,
    SocketData,
} from "../src/types";
import {
    returnPoems,
    storePoem,
} from "./queries";

const retrieveNPoemsAtStart = 1;
const maxEditors = 4;
const defaultGameSettings: IGameSettingsInfo = {
    lineLength: LineLength.short,
    nPoems: 1,
    nRounds: 2,
};


// this function grabs some old poems to have something to show the users
async function populatePoems() {
    const dbPoems = await returnPoems(retrieveNPoemsAtStart) as Array<IPoem>;
    for (const { id, createdAt, title, content } of dbPoems) {
        poems.add({
            content,
            createdAt,
            id,
            title,
        });
    }
}
populatePoems();

// New global data structures
const socketIDToDeviceID: IObjectStringToString = {};
const deviceIDToSocketID: IObjectStringToString = {};  // unique on device. only latest is present
const deviceIDToRoomID: IObjectStringToString = {};
const roomIDToRoom: Map<string, any> = new Map();
const poems: Set<IPoem> = new Set();

class Room {
    // represents a socket.io room and a game of Exquisite Text
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
    hostSocket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null;
    roomID: string;

    editors: Map<string, Editor>;
    spectators: Map<string, Spectator>;
    // editorNames: Array<string>;
    // spectatorNames: Array<string>;
    gameSettings: IGameSettingsInfo;
    gameOngoing: boolean;
    nPoemsInRotation: number;

    constructor(
        io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
        hostSocket: Socket,
        room: string,
    ) {
        this.io = io;
        this.hostSocket = hostSocket;
        this.roomID = room;

        this.editors = new Map();    // deviceID to editorObj
        this.spectators = new Map(); // deviceID to spectatorObj
        // this.editorNames = [];       // deviceID to editorObj
        // this.spectatorNames = [];    // deviceID to spectatorObj
        this.gameSettings = defaultGameSettings;
        this.gameOngoing = false;
        this.nPoemsInRotation = 0;
    }

    addEditor(deviceUUID: string, editorObj: Editor) {
        this.editors.set(deviceUUID, editorObj);
        // this.editorNames.push(editorObj.name);
        this.sendCurrentUserTableInfo(); // give the room updated user info
    }

    removeEditor(deviceUUID: string) {
        this.editors.delete(deviceUUID);
        this.sendCurrentUserTableInfo(); // give the room updated user info
    }

    addSpectator(deviceUUID: string, spectatorObj: Spectator) {
        this.spectators.set(deviceUUID, spectatorObj);
        // this.spectatorNames.push(spectatorObj.name);
        this.sendCurrentUserTableInfo(); // give the room updated user info
    }

    removeSpectator(deviceUUID: string) {
        this.spectators.delete(deviceUUID);
        this.sendCurrentUserTableInfo(); // give the room updated user info
    }

    currentUserTableInfo() {
        const editorNameArr: Array<string> = [];
        const spectatorNameArr: Array<string> = [];
        for (const thisEditor of this.editors.values()) {
            editorNameArr.push(thisEditor.name);
        }
        for (const thisSpectator of this.spectators.values()) {
            spectatorNameArr.push(thisSpectator.name);
        }
        return {
            editors: editorNameArr,
            spectators: spectatorNameArr,
        };
    }

    sendCurrentUserTableInfo() {
        this.io.in(this.roomID).emit("userTableInfo", this.currentUserTableInfo());
    }

    setUpGame() {
        const targetLines = this.gameSettings["nRounds"] * this.editors.size + 2;

        // have each editor set their important properties
        let nPoemsToHandOut = this.gameSettings["nPoems"];
        this.nPoemsInRotation = nPoemsToHandOut;
        let poemIndex = 0;
        for (const thisEditor of this.editors.values()) {
            thisEditor.prepareForGame();
            if (nPoemsToHandOut > 0) {
                const thisPoem = new Poem(targetLines, poemIndex, this.io, this.roomID);
                thisEditor.poemQueue.push(thisPoem);
                thisEditor.isCurrentlyEditing = true;
                nPoemsToHandOut--;
                poemIndex++;
            }
        }

        // should tell editors to navigate to /game and spectators to /spectate
        this.io.in(this.roomID + "_Editors").emit("navigate", "/game");
        this.io.in(this.roomID + "_Spectators").emit("navigate", "/spectate");
        this.gameOngoing = true;
    }

    reorganizeEditors() {
        for (const thisEditor of this.editors.values()) {
            thisEditor.prepareForGame();
        }
    }

}

class Member {
    // represents an Editor or Spectator (which extend this)
    // enforces deviceID constraint
    // (if the same device tries to be a member of the same room twice,
    // the old socket gets disconnected and removed and the new socket replaces it)

    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
    roomID: string;
    deviceID: string;
    name: string;

    constructor(
        io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
        socket: Socket,
        roomID: string,
        deviceID: string,
        name: string,
    ) {
        this.io = io;
        this.socket = socket;
        this.roomID = roomID;
        this.deviceID = deviceID;
        this.name = name;
    }

    joinRoom() {
        this.socket.join(this.roomID);
        this.setReceive(); // listen for certain messages from client
    }

    leaveRoom() {
        console.log(this.name, " leaving ", this. roomID);
        this.io.to(this.socket.id).emit("navigate", "/"); // navigate home (if possible)
        delete deviceIDToRoomID[this.deviceID];
        this.socket.leave(this.roomID);
        this.unsetReceive(); // remove listeners
    }

    // setSend
    // errors about join fail
    // command to go to a certain view
    // supply lobby subscription to keep game view up to date during configuration
    // supply completed poems

    // setReceive
    // getUserTableInfo

    setReceive() {
        this.socket.on("getUserTableInfo", () => this.requestUserTableInfo());
        this.socket.on("getGameSettingsInfo", () => this.requestGameSettingsInfo());
        this.socket.on("getSettingsEnabled", () => this.requestSettingsEnabled());
        this.socket.on("getPoems", () => this.getPoems()); // initial load
        this.socket.on("leave", () => this.leaveRoom());

        // These are all reserved events
        this.socket.on("disconnect", () => this.disconnect());
        this.socket.on("disconnecting", () => this.disconnecting());
    }

    unsetReceive() {
        this.socket.removeAllListeners("getUserTableInfo");
        this.socket.removeAllListeners("getGameSettingsInfo");
        this.socket.removeAllListeners("getSettingsEnabled");
        this.socket.removeAllListeners("getPoems");
        this.socket.removeAllListeners("leave");
        this.socket.removeAllListeners("disconnect");
        this.socket.removeAllListeners("disconnecting");
    }

    requestUserTableInfo() {
        console.log(this.name, "requestUserTableInfo");
        this.io.to(this.socket.id).emit("userTableInfo",
            roomIDToRoom.get(this.roomID).currentUserTableInfo());
    }

    requestGameSettingsInfo() {
        console.log(this.name, "requestGameSettingsInfo");
        this.io.to(this.socket.id).emit("gameSettingsInfo",
            roomIDToRoom.get(this.roomID).gameSettings);
    }

    requestSettingsEnabled() {
        console.log(this.name, "requestSettingsEnabled");
        this.io.to(this.socket.id).emit("gameSettingsEnabled", false);
    }

    disconnect() {
        // note this could be called by something as simple as closing the tab
        // therefore we don't want to boot someone from the game based on this
        // however if they are AFK, etc, we should do those things

        console.log(this.socket.id, "disconnected");

        // socketIDToDeviceID
        // deviceIDToSocketID
        // roomIDToRoom

        // do cleanup intelligently
        // remove from socket map
        // notice that we don't remove from the other maps
        // this gives opportunity for the person to reconnect...
        // but eventually we might have to remove them if they're inactive

        // two-minute timer to boot completely from the Room?
    }

    disconnecting() {
        console.log("socket", this.socket.id, " disconnecting from", this.socket.rooms);
    }

    sendPoem(poem: IPoem) {
        // crucial method that sends the poem to all users
        // make sure the correct members receive this
        this.io.in(this.roomID).emit("poem", poem);
    }

    getPoems() {
        // this is used to bring a new user up to date on what's happening
        poems.forEach((poem) => this.sendPoem(poem));
    }

}

class Host extends Member {
    // does not enforce device ID constraint
    // (same device can be Host AND either of Editor or Spectator)

    joinRoom() {
        // unlike other Members, this does NOT navigate to lobby
        this.socket.join(this.roomID);
        this.setReceive(); // listen for certain messages from client
    }

    // setSend
    // super.setSend()
    // eventually send cool game state info to inform hostGameView

}

class Spectator extends Member {
    joinRoom() {
        super.joinRoom();
        this.socket.join(this.roomID + "_Spectators");
    }

    leaveRoom() {
        super.leaveRoom();
        this.socket.leave(this.roomID + "_Spectators");
        const thisRoom = roomIDToRoom.get(this.roomID);
        thisRoom.removeSpectator(this.deviceID);
    }

    setReceive() {
        super.setReceive();
        this.socket.on("getLines", () => this.getAllPoemLines());
        // this.socket.on("clearLines", () => this.clearLines());
    }

    unsetReceive() {
        console.log("spectator unset reached for", this.name);
        super.unsetReceive();
        this.socket.removeAllListeners("getLines");
        // this.socket.removeAllListeners("clearLines", () => this.clearLines());
    }

    clearLines() {
        this.io.to(this.socket.id).emit("clearLines");
    }

    getAllPoemLines() {
        const thisRoom = roomIDToRoom.get(this.roomID);
        for (const thisEditor of thisRoom.editors.values()) {
            console.log("sending", thisEditor.name);
            for (const thisPoem of thisEditor.poemQueue) {
                console.log("sending", thisEditor.name, "poem", thisPoem.poemID);
                thisPoem.sendAllLinesTo(this.socket.id);
            }
        }
    }
}

class Editor extends Member {
    targetEditorID: string;
    turnPosition: number;
    poemQueue: Array<Poem>;
    isCurrentlyEditing: boolean;

    constructor(
        io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
        hostSocket: Socket,
        roomID: string,
        deviceID: string,
        name: string,
    ) {
        super(io, hostSocket, roomID, deviceID, name);
        this.targetEditorID = "";
        // this.targetEditorSocketID = "";
        this.turnPosition = 0;
        this.poemQueue = [];
        this.isCurrentlyEditing = false;
    }

    prepareForGame() {
        const thisRoom = roomIDToRoom.get(this.roomID);
        const editorDeviceIDs = Array.from(thisRoom.editors.keys()) as Array<string>;
        const nEditors = editorDeviceIDs.length;
        this.turnPosition = editorDeviceIDs.indexOf(this.deviceID);
        const safeNextIndex = (this.turnPosition + 1) % nEditors;
        this.targetEditorID = editorDeviceIDs[safeNextIndex];
        // this.targetEditorSocketID = thisRoom.editors.get(this.targetEditorID).socket.id;
        console.log(this.deviceID, "in position", this.turnPosition, "targets", this.targetEditorID);
    }

    joinRoom() {
        super.joinRoom();
        this.socket.join(this.roomID + "_Editors");
    }

    leaveRoom() {
        super.leaveRoom();
        this.socket.leave(this.roomID + "_Editors");
        const thisRoom = roomIDToRoom.get(this.roomID);
        thisRoom.removeEditor(this.deviceID);

        // hand off any poems in your queue to the next person
        if (thisRoom.gameOngoing) {
            const nextEditor = thisRoom.editors.get(this.targetEditorID);
            nextEditor.poemQueue.push(...this.poemQueue);
            if (!nextEditor.isCurrentlyEditing) {
                nextEditor.possibleStartNewTurn();
            }
        }

        // trigger the room to reorganize the editors
        thisRoom.reorganizeEditors();
    }

    // setSend
    // super.setSend()
    // ((line1Chars, line2Chars) in previousEditor's lineInput)

    setReceive() {
        super.setReceive();
        this.socket.on("getLineEdit", () => this.requestLineEdit()); // initial populate
        this.socket.on("lineEdit", (value) => this.handleLineEdit(value));  //whenever the input box is edited.
        this.socket.on("getEditorActive", () => this.requestActivity());
        this.socket.on("passTurn", (firstPart, secondPart) => this.handlePassTurn(firstPart, secondPart));
        this.socket.on("lastLine", (value) => this.handleLastLine(value)); // whenever a new line has been submitted into the poem.
        this.socket.on("getLastLineStatus", () => this.requestLastLineStatus());
    }

    unsetReceive() {
        super.unsetReceive();
        this.socket.removeAllListeners("getLineEdit");
        this.socket.removeAllListeners("lineEdit");
        this.socket.removeAllListeners("getEditorActive");
        this.socket.removeAllListeners("passTurn");
        this.socket.removeAllListeners("lastLine");
        this.socket.removeAllListeners("getLastLineStatus");
    }

    requestLineEdit() {
        // this is activated when the game view initially loads
        // this should fill in what it's supposed to based on
        // the halfLine of the first Poem in the queue (if this editor is active)

        if (this.hasPoemInQueue()) {
            this.io.to(this.socket.id).emit("lineEdit", this.poemQueue[0].halfLine);
        }
    }

    handleLineEdit(value: string) {
        // when an active editor changes the lineInput, broadcast this
        // to other editors and/or spectators so that they can "watch" them type

        // for other active editors (this version), they want the string

        // for other active editors (next version), all they would need to know is
        // the value.split(lineSepString).map(s => s.length), a 2-tuple of numbers

        // for the spectator, TBD

        // for now, only send to the next Editor in line (each watches who are behind them)
        const thisRoom = roomIDToRoom.get(this.roomID);
        this.io.to(thisRoom.editors.get(this.targetEditorID).socket.id).emit("lineEditorWatch", value);

        const thisPoem = this.poemQueue[0];
        if (!isNil(thisPoem)) {
            thisPoem.lineWasEdited(value);
        }
    }

    requestActivity() {
        console.log(this.name, "requestEditorActivity");
        this.io.to(this.socket.id).emit("editorActive", this.hasPoemInQueue());
    }

    hasPoemInQueue() {
        return (this.poemQueue.length > 0);
    }

    currentlyOnLastLine() {
        const thisPoem = this.poemQueue[0];
        console.log(this.name, "currentlyOnLastLine");
        if (thisPoem) {
            const weThinkCurrentLength = thisPoem.lines.length;
            console.log("we think the poem has ", weThinkCurrentLength, "of", thisPoem.targetLines - 2);
            return weThinkCurrentLength >= (thisPoem.targetLines - 2);
        } else {
            return false;
        }
    }

    requestLastLineStatus() {
        console.log("requestLastLineStatus");
        this.io.to(this.socket.id).emit("lastLine", this.currentlyOnLastLine());
    }

    possibleStartNewTurn() {
        if (this.hasPoemInQueue()) {
            this.io.to(this.socket.id).emit("lineEdit", this.poemQueue[0].halfLine);
            const thisPoem = this.poemQueue[0];
            console.log("we think the poem has", thisPoem.lines.length, "submissions so far");

            if (thisPoem.lines.length === (thisPoem.targetLines - 2)) {
                this.io.to(this.socket.id).emit("lastLine", true);
            } else {
                this.io.to(this.socket.id).emit("lastLine", false);
            }
            this.io.to(this.socket.id).emit("editorActive", true);
            this.isCurrentlyEditing = true;
        } else {
            this.io.to(this.socket.id).emit("lineEdit", "");
            this.io.to(this.socket.id).emit("editorActive", false);
            this.isCurrentlyEditing = false;
        } // otherwise, leave it the way it was?
    }

    handlePassTurn(firstPart: string, secondPart: string) {
        const thisRoom = roomIDToRoom.get(this.roomID);
        const poemToPass = this.poemQueue.shift();
        if (isNil(poemToPass)) {
            return;
        }

        poemToPass.submitLine(firstPart);
        poemToPass.lineWasEdited(secondPart);
        poemToPass.halfLine = secondPart;
        // should be a reference!!!
        const nextEditor = thisRoom.editors.get(this.targetEditorID);
        nextEditor.poemQueue.push(poemToPass);

        // trigger editors to check their queue and update their activity state
        // and view (i.e. the correct lineEdit if necessary)
        // only THIS editor should check its own queue and populate accordingly
        this.possibleStartNewTurn();
        if (!nextEditor.isCurrentlyEditing) {
            nextEditor.possibleStartNewTurn();
        }
    }

    handleLastLine(lastPart: string) {
        console.log("handleLastLine in ", this.name);
        const poemToPass = this.poemQueue.shift();
        if (isNil(poemToPass)) {
            return;
        }
        poemToPass.lines.push(lastPart);

        let poemString = "";
        for (const line of poemToPass.lines) {
            poemString += line + "\n";
        }
        this.handlePoem(poemString);

        const thisRoom = roomIDToRoom.get(this.roomID);
        thisRoom.nPoemsInRotation--;
        // if all editors' poem queues are empty
        // remove each of the editor/spectator deviceIDs from deviceIDToRoomID
        if (thisRoom.nPoemsInRotation === 0) {
            console.log("no poems left to finish; forget everyone's device");
            for (const editorID of thisRoom.editors.keys()) {
                delete deviceIDToRoomID[editorID];
            }
            for (const spectatorID of thisRoom.spectators.keys()) {
                delete deviceIDToRoomID[spectatorID];
            }
        }
    }

    handlePoem(poemString: string) {

        const poem: IPoem = {
            content: poemString,
            createdAt: new Date(),
            id: uuidv4(),
            title: `exquisite text #${Math.round(Math.random() * 100)}`,
        };
        poems.add(poem);

        // add the poem to the database
        storePoem(poem);

        // broadcast the poem via sockets
        this.sendPoem(poem);
    }
}

class VIPEditor extends Editor {
    joinRoom() {
        super.joinRoom();
        this.socket.join(this.roomID + "_VIP");
    }

    leaveRoom() {
        // super.leaveRoom();
        // this.socket.leave(this.roomID + "_VIP");
        //
        // // should make the next editor in line become VIP...
        // const thisRoom = roomIDToRoom.get(this.roomID);
        // const nextEditor = thisRoom.editors.get(this.targetEditorID);
        // nextEditor.becomeVIP();  // or something

        // TODO: implement VIP leaves the room
        // only tricky if we are still in the lobby...
        console.log("Having the VIP leave the room is not implemented yet.");
    }

    setReceive() {
        super.setReceive();
        this.socket.on("alterGameSettings", (value) => this.alterGameSettings(value));
        this.socket.on("startGame", () => this.broadcastStartGame());
    }

    unsetReceive() {
        super.unsetReceive();
        this.socket.removeAllListeners("alterGameSettings");
        this.socket.removeAllListeners("startGame");
    }

    alterGameSettings(gameSettings: IGameSettingsInfo) {
        console.log("alterGameSettings");
        roomIDToRoom.get(this.roomID).gameSettings = gameSettings;
        this.socket.to(this.roomID).emit("gameSettingsInfo", gameSettings);
    }

    broadcastStartGame() {
        // global in nature, so it will mainly eal with the room
        console.log("startGame");
        roomIDToRoom.get(this.roomID).setUpGame();
    }

    requestSettingsEnabled() {
        console.log(this.name, "requestSettingsEnabled");
        this.io.to(this.socket.id).emit("gameSettingsEnabled", true);
    }
}

class Poem {
    // represents a single poem

    lines: Array<string>;
    halfLine: string;
    poemID: string;
    targetLines: number;
    poemIndex: number;
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
    roomID: string;

    // any edit of lines or half-line (e.g. submitLine, handleLineEdit)
    // will send a message to the Spectators in the roomID

    constructor(
        targetLines: number,
        poemIndex: number,
        io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
        roomID: string,
    ) {
        this.targetLines = targetLines;
        this.poemIndex = poemIndex;
        this.io = io;
        this.roomID = roomID;
        this.lines = [];
        this.halfLine = "";
        this.poemID = uuidv4();
    }

    submitLine(line: string) {
        this.lines.push(line);
        this.io.in(this.roomID + "_Spectators").emit("lineSpectator", this.poemIndex, line);
    }

    lineWasEdited(value: string) {
        this.io.in(this.roomID + "_Spectators").emit("lineEditSpectator", this.poemIndex, value);
    }

    sendAllLinesTo(socketID: string) {
        // this is used to bring a new spectator up to date
        this.lines.forEach((line) => this.sendLine(line, socketID));
    }

    sendLine(line: string, socketID: string) {
        this.io.to(socketID).emit("lineSpectator", this.poemIndex, line);
    }
}

// The module exports a single function poem that takes the Socket.IO server instance as a parameter.
function sockets(io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {

    // connection is a reserved name for a socket event when someone connects
    io.on("connection", (socket) => {
        // When a client requests a connection, the callback will create a new Connection instance
        // and pass the Socket.IO server instance and the new socket to the constructor.

        socket.on("recognizeDevice", (deviceID) => {

            console.log("new socket", socket.id, "from device", deviceID);

            const deviceInARoom = Object.prototype.hasOwnProperty.call(deviceIDToRoomID, deviceID);
            if (deviceInARoom) {
                // try to reconnect them to that room in the correct role
                const roomID = deviceIDToRoomID[deviceID];
                const theRoom = roomIDToRoom.get(roomID);
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
                theMember.joinRoom();    // re-join the correct rooms
                // theMember.setReceive(); // amazingly, this isn't necessary...
                io.to(socket.id).emit("navigate", targetView); // navigate to correct view
            } // else this device isn't in a room yet, nothing to do

            socketIDToDeviceID[socket.id] = deviceID; // since socket is always uuid, won't overwrite
            deviceIDToSocketID[deviceID] = socket.id; // will overwrite previous
        });

        socket.on("createGameHost", (roomID) => {
            console.log("createGameHost for ", socket.id, "joining", roomID);
            // notice we don't add the host device to deviceIDToRoomID
            const thisHost = new Host(io, socket, roomID, socketIDToDeviceID[socket.id], "HOST");
            thisHost.joinRoom();
            const thisRoom = new Room(io, socket, roomID);
            roomIDToRoom.set(roomID, thisRoom);
            console.log("room", roomID, "created with ", socket.id, "as host");
        });

        socket.on("joinGameAs", (role, roomID, name) => {
            console.log("socket", socket.id, "joinGameAs", role, "to room", roomID, "with name", name);
            if (!roomIDToRoom.has(roomID)) {
                console.log(roomID, "does not exist");
                io.to(socket.id).emit("joinError", "Room does not exist.");
                return;
            }
            const targetRoom = roomIDToRoom.get(roomID);
            const deviceID = socketIDToDeviceID[socket.id];
            if (role === "Editor") {
                if (targetRoom.gameOngoing) {
                    console.log(roomID, "game is already ongoing");
                    io.to(socket.id).emit("joinError", "Game already ongoing. Join as spectator?");
                    return;
                }
                if (targetRoom.editors.size >= maxEditors) {
                    console.log("trying to join as editor but it's already full");
                    io.to(socket.id).emit("joinError", "Writer's room full. Join as spectator?");
                    return;
                }
                deviceIDToRoomID[deviceID] = roomID;
                const useEditorClass = (targetRoom.editors.size === 0
                    ? VIPEditor
                    : Editor);
                const thisEditor = new useEditorClass(io, socket, roomID, deviceID, name);
                thisEditor.joinRoom();
                io.to(socket.id).emit("navigate", "/lobby");
                targetRoom.addEditor(deviceID, thisEditor);
            } else if (role === "Spectator") {
                deviceIDToRoomID[deviceID] = roomID;
                const thisSpectator = new Spectator(io, socket, roomID, deviceID, name);
                thisSpectator.joinRoom();
                if (targetRoom.gameOngoing) {
                    io.to(socket.id).emit("navigate", "/spectate");
                } else {
                    io.to(socket.id).emit("navigate", "/lobby");
                }
                targetRoom.addSpectator(deviceID, thisSpectator);
            }
        });
    });
}

export default sockets;
