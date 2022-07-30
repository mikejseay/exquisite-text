// Handle lines passed between users and the server
// and using that content, we maintain the user list and current history of the poem.
// as far as I can tell, this will be the equivalent of the exquisite functionality, etc.

import { Server, Socket } from "socket.io";
import {
  ClientToServerEvents,
  IGameSettingsInfo,
  ILine,
  InterServerEvents,
  IPoem,
  ServerToClientEvents,
  SocketData
} from "../src/types";

const db = require("./queries");

const defaultUser = {
  id: "anon",
  name: "Anonymous"
};

// const randomUserNames = ["Johnald", "Jimothy", "Gouglas", "Bobson", "Danthony", "Davery",
//   "Johnald", "Jimothy", "Gouglas", "Bobson", "Danthony", "Davery"];
// const randomColors = ["red", "blue", "orange", "green", "purple"];
const defaultGameSettings = {
  lineLength: "short",
  nRounds: 2,
  nPoems: 1,
}

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
const sockets = new Map();

// all previously necessary globals must now also be mapped to the corresponding room
// these need much better typing once the dust settles...
const roomHost = new Map(); // room name to host socket
// const roomEditors: Map<string, Map<string, string>> = new Map();  // room name to map of (deviceUUID to name)
const roomEditors = new Map();  // room name to map of (deviceUUID to name)
const roomSpectators = new Map(); // room name to map of (deviceUUID to name)
const roomGameSettings = new Map(); // room name to Object
// const roomGameState = new Map(); // room name to ???
// const roomLineEdits = new Map(); // room name to Array (length equal to nPoems in game) of strings
// const roomLines = new Map(); // room name to an Array (length equal to nPoems in game) of Arrays (variable length) of strings
// const roomPoems = new Map(); // room name to a Set (length equal to nPoems in game at end of game)

const poemQueue: string[][] = [];  // array of arrays (inner arrays will be used as queues)
const poem2LineEdit = new Map(); // map of string: string
const poem2Lines = new Map(); // map of string: Set

let lineEditCurrentVal = "";
let lines: Set<ILine> = new Set();
const poems: Set<IPoem> = new Set();


const maxEditors = 2;

// function countElementsMatching(myIterator: IterableIterator<string>, valMatch: string) {
//   let count = 0;
//   for (const value of myIterator) {
//     if (value === valMatch) {
//       count++;
//     }
//   }
//   return count;
// }

// When a user connects, a Connection object will be created for them, which will use their socket to connect
// to the IO server. It sits there and handles events from their socket
// It should NOT automatically add them to the game.
class Connection {
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
  socket: Socket;
  deviceUUID: null | string;
  room: string;
  role: string;
  name: null | string;
  active: boolean;
  turnPosition: number;
  targetEditorUUID: unknown;

  // The constructor of the Connection class sets up callbacks on events coming from the socket.
  constructor(
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    socket: Socket
  ) {
    this.socket = socket;
    this.io = io;
    this.deviceUUID = null;
    this.room = "/";
    this.role = "";
    this.name = null;
    this.active = false;
    this.turnPosition = 0;
    this.targetEditorUUID = "";

    this.initialConnect();

    // any socket might need these messages from client
    socket.on("recognizeDevice", (value) => this.handleRecognizeDevice(value));
    socket.on("createGameHost", (value) => this.createGameHost(value));
    socket.on("joinGameEditor", (room, name) => this.handleJoinGameEditor(room, name));
    socket.on("joinGameSpectator", (room, name) => this.handleJoinGameSpectator(room, name));

    // to do with the lobby
    socket.on("getUserTableInfo", () => this.requestUserTableInfo());
    socket.on("alterGameSettings", (value) => this.alterGameSettings(value));
    socket.on("getGameSettingsInfo", () => this.requestGameSettingsInfo());
    socket.on("getSettingsEnabled", () => this.requestSettingsEnabled());
    socket.on("startGame", () => this.broadcastStartGame());
    socket.on("getRole", () => this.requestRole());
    socket.on("getEditorActive", () => this.requestEditorActivity());

    // to do with the game
    socket.on("editorsDefineTurns", () => this.defineTurnPositionAndTarget());
    socket.on("passTurn", (firstPart, secondPart) => this.handlePassTurn(firstPart, secondPart))

    // These are all reserved events
    socket.on("disconnect", () => this.disconnect());
    socket.on("disconnecting", () => this.disconnecting());
    socket.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.line}`);
    });
  }

  addSpecialListeners() {
    // only certain kinds of sockets will need these events
    this.socket.on("getLines", () => this.getLines()); // retrieve all existing finished lines from the server.
    this.socket.on("getLineEdit", () => this.getLineEdit());
    this.socket.on("line", (value) => this.handleLine(value)); // whenever a new line has been submitted into the poem.
    this.socket.on("lastLine", (value) => this.handlelastLine(value)); // whenever a new line has been submitted into the poem.
    this.socket.on("lineEdit", (value) => this.handleLineEdit(value));  //whenever the input box is edited.
    this.socket.on("poemDone", () => this.poemDone());
    this.socket.on("clearLines", () => this.clearLines());
    this.socket.on("getPoems", () => this.getPoems());
  }

  initialConnect() {
    console.log("new socket connection:", this.socket.id);
    sockets.set(this.socket, {
      deviceUUID: null,
      role: null,
      room: "/"
    });
  }

  disconnect() {
    console.log(this.socket.id, "disconnected");

    // remove from socket map
    sockets.delete(this.socket);

    // notice that we don't remove from the other maps
    // this gives opportunity for the person to reconnect...
    // but eventually we might have to remove them if they're inactive
  }

  disconnecting() {
    console.log("socket disconnecting from", this.socket.rooms);
  }

  handleRecognizeDevice(deviceUUID: string) {
    this.deviceUUID = deviceUUID;
    sockets.get(this.socket)["deviceUUID"] = deviceUUID; // this actually sets
  }

  joinRoom(roomName: string) {
    this.socket.join(roomName);
    this.room = roomName;
    sockets.get(this.socket)["room"] = roomName;
  }

  assignRole(role: string) {
    this.role = role;
    sockets.get(this.socket)["role"] = role;

    // set up listeners according to role
  }

  createGameHost(roomName: string) {
    console.log("createGameHost for ", this.socket.id, "joining", roomName);
    this.joinRoom(roomName); // this creates the room
    roomHost.set(roomName, this.socket);
    roomEditors.set(roomName, new Map());
    roomSpectators.set(roomName, new Map());
    roomGameSettings.set(roomName, defaultGameSettings);
    this.assignRole("Host");
    console.log("room", roomName, "created with ", this.socket.id, "as host");
  }

  attemptJoinRoom(roomName: string) {
    const room = this.io.sockets.adapter.rooms.get(roomName);
    if (room) {
      console.log("the room exists");
      this.joinRoom(roomName);
      return true;
    } else {
      console.log("the room does not exist");
      this.io.to(this.socket.id).emit("joinError", "Room does not exist.");
      return false;
    }
  }

  handleJoinGameEditor(roomName: string, userName: string) {
    console.log("handleJoinGameEditor for ", userName, "to room", roomName);
    const joinSuccess = this.attemptJoinRoom(roomName);  // checks if room exists and gives error if not
    if (!joinSuccess) {
      return;
    }
    const nEditorsInRoom = roomEditors.get(roomName).size;
    if (nEditorsInRoom === maxEditors) {
      console.log("trying to join as editor but it's already full");
      this.io.to(this.socket.id).emit("joinError", "Writer's room full. Join as spectator?");
      return;
    }
    this.assignRole("Editor");
    roomEditors.get(roomName).set(this.deviceUUID, userName);
    this.io.to(this.socket.id).emit("editorJoinSuccess");
    this.addSpecialListeners();
    this.broadcastUserTableInfo();
  }

  handleJoinGameSpectator(roomName: string, userName: string) {
    console.log("handleJoinGameSpectator for ", userName, "to room", roomName);
    const joinSuccess = this.attemptJoinRoom(roomName);  // checks if room exists and gives error if not
    if (!joinSuccess) {
      return;
    }
    this.assignRole("Spectator");
    roomSpectators.get(roomName).set(this.deviceUUID, userName);
    this.io.to(this.socket.id).emit("spectatorJoinSuccess");
    this.addSpecialListeners();
    this.broadcastUserTableInfo();
  }

  broadcastUserTableInfo() {
    console.log("broadcastUserTableInfo");
    this.io.in(this.room).emit("userTableInfo",
      {
        editors: Array.from(roomEditors.get(this.room).values()),
        spectators: Array.from(roomSpectators.get(this.room).values())
      });
  }

  requestUserTableInfo() {
    console.log("requestUserTableInfo");
    this.io.to(this.socket.id).emit("userTableInfo",
      {
        editors: Array.from(roomEditors.get(this.room).values()),
        spectators: Array.from(roomSpectators.get(this.room).values())
      });
  }

  alterGameSettings(gameSettings: IGameSettingsInfo) {
    console.log("alterGameSettings");
    roomGameSettings.set(this.room, gameSettings);
    this.socket.to(this.room).emit("gameSettingsInfo", gameSettings);
  }

  requestGameSettingsInfo() {
    console.log("requestGameSettingsInfo");
    this.io.to(this.socket.id).emit("gameSettingsInfo",
      roomGameSettings.get(this.room));
  }

  requestSettingsEnabled() {
    console.log("requestSettingsEnabled");
    // gets first value of roomEditors
    const [VIPEditorUUID] = roomEditors.get(this.room).keys();
    // first editor is always VIP
    this.io.to(this.socket.id).emit("gameSettingsEnabled", VIPEditorUUID === this.deviceUUID);
  }

  broadcastStartGame() {
    // be sure that the game settings are legit
    console.log("startGame");
    this.setUpGame();
    this.io.in(this.room).emit("enactStartGame");  // sends editors to /game route, which loads lineInput
  }

  defineTurnPositionAndTarget() {
    console.log("defineTurnPositionAndTarget");
    const editorArray = Array.from(roomEditors.get(this.room).keys()); // array of deviceUUIDs
    this.turnPosition = editorArray.indexOf(this.deviceUUID);
    const safeNextIndex = (this.turnPosition + 1) % editorArray.length;
    this.targetEditorUUID = editorArray[safeNextIndex];
    console.log(this.deviceUUID, "in position", this.turnPosition, "targets", this.targetEditorUUID);
  }

  setUpGame() {
    // this connection (VIP) will configure the globals for the game
    // each editor (in each room) has a poemQueue which (potentially) contains a poemID
    const nEditors = roomEditors.get(this.room).size;
    for (let i = 0; i < nEditors; i++) {
      poemQueue.push([]);
    }
    const initPoemID: string = uuidv4(); // poemID
    poemQueue[0].push(initPoemID); // VIP always in first position
    poem2LineEdit.set(initPoemID, "");
    poem2Lines.set(initPoemID, new Set());

    // each editor also has a targetEditor (linked chain)
    // the poemID maps to a lineEdit and Lines object
    // at the beginning of the game, the VIP's poemQueue will contain the new poemID
    // and the poem2LineEdit / poem2Lines references will be empty string / empty Set
    // the targetEditor chain will be established based on the state of roomEditors.get(this.room)
    // (if any editor is booted, we can reorganize the targetEditors and poemQueues)

    // we start the game by checking which editors have poemIDs in their queue via setActivityBasedOnQueues()
    // any editors with poemIDs in their queue become active, and those who don't become inactive
    // the VIP will do lineEdits (broadcast normally) and then submit, which will
    // 1) move the poemID to their targetEditor's poemQueue
    // 2) add the first line to the poem2Lines
    // 3) set the second line to the value of poem2LineEdit
    // 4) trigger setActivityBasedOnQueues()
    // const poemQueue = [];  // array of arrays (inner arrays will be used as queues)
    // const poem2LineEdit = []; // array of strings
    // const poem2Lines = []; // array of Sets

  }

  requestRole() {
    console.log("requestRole");
    this.io.to(this.socket.id).emit("sendRole", this.role);
  }

  requestEditorActivity() {
    console.log("requestEditorActivity");
    const hasPoemInQueue = poemQueue[this.turnPosition].length > 0
    this.io.to(this.socket.id).emit("receiveEditorActive", hasPoemInQueue);
  }

  handlePassTurn(firstPart: string, secondPart: string) {
    console.log("handlePassTurn");
    const editorArray = Array.from(roomEditors.get(this.room).keys());
    const safeNextIndex = (this.turnPosition + 1) % editorArray.length;
    const poemIDToPass = poemQueue[this.turnPosition].pop() as string;
    poemQueue[safeNextIndex].push(poemIDToPass);

    poem2Lines.get(poemIDToPass).add(firstPart);
    poem2LineEdit.set(poemIDToPass, secondPart);

    // set the current lineInput to the first
    this.socket.to(this.room).emit("lineEdit", secondPart);
    lineEditCurrentVal = secondPart;

    // trigger each socket to check its own queue and update its activity state
    // here we send to the whole room but should be only editors in theory
    this.io.in(this.room).emit("checkIfActive");
  }

  handlelastLine(lastPart: string) {
    console.log("handleLastLine");
    const poemIDToPass = poemQueue[this.turnPosition].pop() as string;
    poem2Lines.get(poemIDToPass).add(lastPart);

    let poemString = "";
    for (let line of poem2Lines.get(poemIDToPass)) {
      poemString += line + "\n";
    }
    this.handlePoem(poemString);
    lines.clear();
  }

  // When a new line arrives from this Connection, handleMessage() creates a line object and adds it to lines
  handleLine(value: ILine["value"]) {
    const line: ILine = {
      id: uuidv4(),
      user: roomEditors.get(this.deviceUUID) || defaultUser,
      value,
      createdAt: new Date()
    };
    lines.add(line);

    // It will then call sendMessage() which uses the Socket.IO server
    // to send the line to all sockets that are currently connected.
    // It is this call that will update all clients simultaneously.
    // TODO: Technically could be broadcast only to spectators.
    this.sendLine(line);
  }

  sendLine(line: ILine) {
    // crucial method that sends the line to all users
    // note that here we name this emitted signal "line," which allows us to identify it within IO
    this.io.in(this.room).emit("line", line);
  }

  getLines() {
    lines.forEach((line) => this.sendLine(line));
  }

  clearLines() {
    this.io.in(this.room).emit("clearLines");
  }

  // this is used to bring a new user up to date on what's happening in the lineEdit
  getLineEdit() {
    this.io.to(this.socket.id).emit("lineEdit", lineEditCurrentVal);
  }

  handleLineEdit(value: string) {
    // this is broadcast because if it were just emit, it would cause a looping behavior
    this.socket.to(this.room).emit("lineEdit", value);
    lineEditCurrentVal = value;
  }

  poemDone() {
    let poemString = "";
    for (let line of lines) {
      poemString += line["value"] + "\n";
    }
    this.handlePoem(poemString);
    lines.clear();
  }

  // When a new poem arrives from this Connection, handlePoem() creates a poem object and adds it to poems
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

    // It will then call sendMessage() which uses the Socket.IO server
    // to send the poem to all sockets that are currently connected.
    // It is this call that will update all clients simultaneously.
    this.sendPoem(poem);
  }

  sendPoem(poem: IPoem) {
    // crucial method that sends the poem to all users
    // note that here we name this emitted signal "poem," which allows us to identify it within IO
    this.io.in(this.room).emit("poem", poem);
  }

  // this is used to bring a new user up to date on what's happening, could be good for Spectator mode
  getPoems() {
    poems.forEach((poem) => this.sendPoem(poem));
  }
}

// The module exports a single function poem that takes the Socket.IO server instance as a parameter.
function poem(io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {

  // connection is a reserved name for a socket event when someone connects
  io.on("connection", (socket) => {
    // When a client requests a connection, the callback will create a new Collection instance
    // and pass the Socket.IO server instance and the new socket to the constructor.

    // this is about where we would declare or handle their status
    // as the active editor, an inactive editor, or a spectator

    new Connection(io, socket);
  });
}

module.exports = poem;
