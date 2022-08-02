// Handle lines passed between users and the server
// and using that content, we maintain the user list and current history of the poem.
// as far as I can tell, this will be the equivalent of the exquisite functionality, etc.

import { Server, Socket } from "socket.io";
import {
  ClientToServerEvents,
  IGameSettingsInfo,
  ILine,
  InterServerEvents,
  IPoem, IUserTableInfo,
  ServerToClientEvents,
  SocketData,
  ISocketIDToDeviceID,
  IDeviceIDToSocketID,
  LineLength,
} from "../src/types";

const db = require("./queries");
const uuidv4 = require("uuid").v4; // a function that generates a random uuid for lines

// this function grabs some old poems to have something to show the users
async function populatePoems() {
  const dbPoems = await db.returnPoems(3);
  for (const { id, createdAt, title, content } of dbPoems) {
    poems.add({
      id,
      createdAt,
      title,
      content
    });
  }
}
populatePoems();

// New global data structures
// const socketToDeviceID: ISocketToDeviceID = new Map();  // unique on socket. can have multiple devices on socket
// const deviceIDToSocket: IDeviceIDToSocket = new Map();  // unique on device. only latest is present

const socketIDToDeviceID: ISocketIDToDeviceID = {};  // unique on socket. can have multiple devices on socket
const deviceIDToSocketID: IDeviceIDToSocketID = {};  // unique on device. only latest is present
const roomIDToRoom: Map<string, any> = new Map();
const poems: Set<IPoem> = new Set();

const maxEditors = 2;
const defaultGameSettings = {
  lineLength: LineLength.short,
  nRounds: 2,
  nPoems: 1,
} as IGameSettingsInfo;

class Room {
  // represents a socket.io room and a game of Exquisite Text
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
  hostSocket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null;
  roomID: string;

  editors: Map<string, Editor>;
  spectators: Map<any, any>;
  editorNames: Array<string>;
  spectatorNames: Array<string>;
  gameSettings: IGameSettingsInfo;
  poems: Map<any, any>;

  constructor(
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    hostSocket: Socket,
    room: string,
  ) {
    this.io = io;
    this.hostSocket = hostSocket;
    this.roomID = room;

    this.editors = new Map();  // deviceID to editorObj
    this.spectators = new Map();  // deviceID to spectatorObj
    this.editorNames = [];  // deviceID to editorObj
    this.spectatorNames = [];  // deviceID to spectatorObj
    this.gameSettings = defaultGameSettings;
    this.poems = new Map();
  }

  addEditor(deviceUUID: string, editorObj: any) {
    this.editors.set(deviceUUID, editorObj);
    this.editorNames.push(editorObj.name);
    this.sendCurrentUserTableInfo(); // give the room updated user info
  }

  addSpectator(deviceUUID: string, spectatorObj: any) {
    this.spectators.set(deviceUUID, spectatorObj);
    this.spectatorNames.push(spectatorObj.name);
    this.sendCurrentUserTableInfo(); // give the room updated user info
  }

  currentUserTableInfo() {
    return {
      editors: this.editorNames,
      spectators: this.spectatorNames
    };
  }

  sendCurrentUserTableInfo() {
    this.io.in(this.roomID).emit("userTableInfo", this.currentUserTableInfo());
  }

  setUpGame() {
    const targetLines = this.gameSettings["nRounds"] * this.editors.size + 2;

    // have each editor set their important properties
    let nPoemsToHandOut = this.gameSettings["nPoems"];
    for (const thisEditor of this.editors.values()) {
      thisEditor.prepareForGame();
      if (nPoemsToHandOut > 0) {
        const thisPoem = new Poem(targetLines);
        thisEditor.poemQueue.push(thisPoem);
        thisEditor.isCurrentlyEditing = true;
        nPoemsToHandOut--;
      }
    }

    // should tell editors to navigate to /game and spectators to /spectate
    this.io.in(this.roomID + "_Editors").emit("navigate", "/game")
    this.io.in(this.roomID + "_Spectators").emit("navigate", "/spectate")
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

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
              hostSocket: Socket,
              roomID: string,
              deviceID: string,
              name: string) {
    this.io = io;
    this.socket = hostSocket;
    this.roomID = roomID;
    this.deviceID = deviceID;
    this.name = name;
  }

  joinRoom() {
    this.socket.join(this.roomID);
    this.io.to(this.socket.id).emit("joinSuccess"); // navigates to /lobby
    this.setReceive(); // listen for certain messages from client
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

    // These are all reserved events
    this.socket.on("disconnect", () => this.disconnect());
    this.socket.on("disconnecting", () => this.disconnecting());
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

  requestSettingsEnabled () {
    console.log(this.name, "requestSettingsEnabled");
    this.io.to(this.socket.id).emit("gameSettingsEnabled", false);
  }

  disconnect() {
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
    console.log("socket disconnecting from", this.socket.rooms);
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

  // eventually send cool game state info to inform spectatorGameView
}

class Editor extends Member {

  previousEditorID: string;
  previousEditorSocketID: string;
  targetEditorID: string;
  targetEditorSocketID: string;
  turnPosition: number;
  poemQueue: Array<any>;
  isCurrentlyEditing: boolean;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
              hostSocket: Socket,
              roomID: string,
              deviceID: string,
              name: string) {
    super(io, hostSocket, roomID, deviceID, name);
    this.previousEditorID = "";
    this.previousEditorSocketID = "";
    this.targetEditorID = "";
    this.targetEditorSocketID = "";
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
    const safePrevIndex = (this.turnPosition - 1 + nEditors) % nEditors;
    this.targetEditorID = editorDeviceIDs[safeNextIndex];
    this.previousEditorID = editorDeviceIDs[safePrevIndex];
    this.targetEditorSocketID = thisRoom.editors.get(this.targetEditorID).socket.id;
    this.previousEditorSocketID = thisRoom.editors.get(this.previousEditorID).socket.id;
    console.log(this.deviceID, "in position", this.turnPosition, "targets", this.targetEditorID);
  }

  joinRoom() {
    super.joinRoom();
    this.socket.join(this.roomID + "_Editors");
  }

  // setSend
    // super.setSend()
    // ((line1Chars, line2Chars) in previousEditor's lineInput)

  setReceive() {
    super.setReceive();
    this.socket.on("getLineEdit", () => this.requestLineEdit()); // initial populate
    this.socket.on("lineEdit", (value) => this.handleLineEdit(value));  //whenever the input box is edited.
    this.socket.on("getEditorActive", () => this.requestActivity());
    this.socket.on("passTurn", (firstPart, secondPart) => this.handlePassTurn(firstPart, secondPart))
    this.socket.on("lastLine", (value) => this.handleLastLine(value)); // whenever a new line has been submitted into the poem.
    this.socket.on("getLastLineStatus", () => this.requestLastLineStatus());

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
    // when an active editor changes the lineInput, they want to broadcast this
    // to the other active editors and/or spectators so that they can "watch" them type

    // for other active editors (this version), they want the string

    // for other active editors (next version), all they would need to know is
    // the value.split(lineSepString).map(s => s.length), a 2-tuple of numbers

    // for the spectator, TBD

    // this will change in next version
    // this.socket.to(this.roomID + "_Editors").emit("lineEdit", value);
    this.io.to(this.targetEditorSocketID).emit("lineEditSpectate", value);
  }

  requestActivity() {
    console.log("requestEditorActivity");
    this.io.to(this.socket.id).emit("editorActive", this.hasPoemInQueue());
  }

  hasPoemInQueue() {
   return (this.poemQueue.length > 0);
  }

  currentlyOnLastLine() {
    const thisPoem = this.poemQueue[0];
    if (thisPoem) {
      console.log("we think the poem has ", thisPoem.lines.length, "of", thisPoem.targetLines - 2);
      return thisPoem.lines.length === (thisPoem.targetLines - 2);
    } else {
      return false;
    }
  }

  requestLastLineStatus() {
    console.log("requestLastLineStatus");
    this.io.to(this.socket.id).emit("lastLine", this.currentlyOnLastLine());
  }

  possibleStartNewTurn() {
    // console.log(this.name, "is checking if they are starting a new turn");
    if (this.hasPoemInQueue()) {
      // console.log(this.name, "thinks their poemQueue is", this.poemQueue);
      this.io.to(this.socket.id).emit("lineEdit", this.poemQueue[0].halfLine);
      const thisPoem = this.poemQueue[0];

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
    // console.log(this.name, "passing turn");
    const thisRoom = roomIDToRoom.get(this.roomID) as Room;
    // console.log(this.name, "poemQueue starts out as", this.poemQueue);
    const poemToPass = this.poemQueue.shift();
    // console.log(this.name, "after shift it becomes", this.poemQueue);
    // console.log(this.name, "and the poem itself is", poemToPass);

    poemToPass.lines.push(firstPart);
    poemToPass.halfLine = secondPart;
    // should be a reference!!!
    const nextEditor = thisRoom.editors.get(this.targetEditorID) as Editor;
    // console.log(this.name, "at first thinks the next player's poemQueue is", nextEditor.poemQueue);
    nextEditor.poemQueue.push(poemToPass);
    // thisRoom.editors.get(this.targetEditorID).poemQueue.push(poemToPass)
    // console.log(this.name, "after pushing thinks the next player's poemQueue is", nextEditor.poemQueue);
    // const nextEditorAgain = thisRoom.editors.get(this.targetEditorID) as Editor;
    // console.log(this.name, "on second check thinks the next player's poemQueue is", nextEditorAgain.poemQueue);
    // nextEditor.receiveNewPoem(poemToPass);

    // trigger editors to check their queue and update their activity state
    // and view (i.e. the correct lineEdit if necessary)
    // Shouldn't it be only the current editor and target editor?

    // only THIS editor should check its own queue and populate accordingly
    this.possibleStartNewTurn();
    if (!nextEditor.isCurrentlyEditing) {
      // console.log("we thought", nextEditor.name, "wasn't currently editing");
      nextEditor.possibleStartNewTurn();
    }

    // console.log("at the end of passing turn", this.name, "think its own poemQueue is", this.poemQueue);
    // const thisRoomAgain = roomIDToRoom.get(this.roomID) as Room;
    // const meEditor = thisRoomAgain.editors.get(this.deviceID) as Editor;
    // console.log("but on second access the room thinks that it's", meEditor.poemQueue);
  }

  handleLastLine(lastPart: string) {
    console.log("handleLastLine");
    const poemToPass = this.poemQueue.pop();
    poemToPass.lines.push(lastPart);

    let poemString = "";
    for (const line of poemToPass.lines) {
      poemString += line + "\n";
    }
    this.handlePoem(poemString);
  }

  handlePoem(poemString: string) {

    const poem: IPoem = {
      id: uuidv4(),
      content: poemString,
      createdAt: new Date(),
      title: `exquisite text #${Math.round(Math.random() * 100)}`
    };
    poems.add(poem);

    // add the poem to the database
    db.storePoem(poem);

    // broadcast the poem via sockets
    this.sendPoem(poem);
  }
}

class VIPEditor extends Editor {

  joinRoom() {
    super.joinRoom();
    this.socket.join(this.roomID + "_VIP");
  }

  setReceive() {
    super.setReceive();
    this.socket.on("alterGameSettings", (value) => this.alterGameSettings(value));
    this.socket.on("startGame", () => this.broadcastStartGame());
  }

  alterGameSettings(gameSettings: IGameSettingsInfo) {
    console.log("alterGameSettings");
    roomIDToRoom.get(this.roomID).gameSettings = gameSettings;
    this.socket.to(this.roomID).emit("gameSettingsInfo", gameSettings);
  }

  broadcastStartGame () {
    // global in nature, so it will mainly deal with the room
    console.log("startGame");
    roomIDToRoom.get(this.roomID).setUpGame();
  }

  requestSettingsEnabled () {
    console.log(this.name, "requestSettingsEnabled");
    this.io.to(this.socket.id).emit("gameSettingsEnabled", true);
  }
}

class Poem {
  // represents a single poem

  targetLines: number;
  lines: Array<string>;
  halfLine: string;
  poemID: string;

  constructor(targetLines: number) {
    this.targetLines = targetLines;
    this.lines = [];
    this.halfLine = "";
    this.poemID = uuidv4();
  }

}

// The module exports a single function poem that takes the Socket.IO server instance as a parameter.
function socketFunctionality(io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {

  // connection is a reserved name for a socket event when someone connects
  io.on("connection", (socket) => {
    // When a client requests a connection, the callback will create a new Connection instance
    // and pass the Socket.IO server instance and the new socket to the constructor.

    console.log("new socket connection spawned");

    socket.on("recognizeDevice", (deviceID) => {
      // socketToDeviceID.set(socket, deviceID); // since socket is always uuid, won't overwrite
      // deviceIDToSocket.set(deviceID, socket); // will overwrite previous
      socketIDToDeviceID[socket.id] = deviceID; // since socket is always uuid, won't overwrite
      deviceIDToSocketID[deviceID] = socket.id; // will overwrite previous

      // deviceUUID --> roomID --> Room --> Room.editors or Room.spectators.keys() --> deviceUUID
      // at the very least we need deviceIDToRoomID
      // and then define methods in Member to allow you to attach a new socket to the same Member
    });

    // roomIDToRoom

    socket.on("createGameHost", (roomID) => {

      console.log("createGameHost for ", socket.id, "joining", roomID);
      // device doesn't matter for host
      const thisHost = new Host(io, socket, roomID, socketIDToDeviceID[socket.id], "HOST")
      thisHost.joinRoom();
      const thisRoom = new Room(io, socket, roomID)
      roomIDToRoom.set(roomID, thisRoom);
      console.log("room", roomID, "created with ", socket.id, "as host");
    });

    socket.on("joinGameAs", (role, roomID, name) => {

      console.log("socket", socket.id, "joinGameAs", role, "to room", roomID, "with name", name);
      if (!roomIDToRoom.has(roomID)) {
        console.log(roomID, "does not exist");
        io.to(socket.id).emit("joinError", "Room does not exist.");
        return
      }
      const targetRoom = roomIDToRoom.get(roomID);
      const deviceID = socketIDToDeviceID[socket.id];
      if (role === "Editor") {
        if (targetRoom.editors.size >= maxEditors) {
          console.log("trying to join as editor but it's already full");
          io.to(socket.id).emit("joinError", "Writer's room full. Join as spectator?");
          return
        }
        const useEditorClass = (targetRoom.editors.size === 0 ? VIPEditor : Editor);
        const thisEditor = new useEditorClass(io, socket, roomID, deviceID, name);
        thisEditor.joinRoom();
        targetRoom.addEditor(deviceID, thisEditor);
      } else if (role === "Spectator") {
        const thisSpectator = new Spectator(io, socket, roomID, deviceID, name);
        thisSpectator.joinRoom();
        targetRoom.addSpectator(deviceID, thisSpectator);
      }
    })
  });
}

module.exports = socketFunctionality;
