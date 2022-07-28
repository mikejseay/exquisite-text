// Handle lines passed between users and the server
// and using that content, we maintain the user list and current history of the poem.
// as far as I can tell, this will be the equivalent of the exquisite functionality, etc.

import { Server, Socket } from "socket.io";
import { ClientToServerEvents, ILine, InterServerEvents, IPoem, ServerToClientEvents, SocketData } from "../src/types";

const db = require("./queries");

const defaultUser = {
  id: "anon",
  name: "Anonymous"
};

const randomUserNames = ["Johnald", "Jimothy", "Gouglas", "Bobson", "Danthony", "Davery",
  "Johnald", "Jimothy", "Gouglas", "Bobson", "Danthony", "Davery"];
const randomColors = ["red", "blue", "orange", "green", "purple"];

const uuidv4 = require("uuid").v4; // a function that generates a random uuid for lines

// The poem room holds global data structures, lines, poems, and users.

let lineEditCurrentVal = "";
let lines: Set<ILine> = new Set();
const poems: Set<IPoem> = new Set();

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

// The users map is intended to hold user information indexed by the socket connection.
// the key is the socket, and the value is an object full of info
const users = new Map();

const maxEditors = 2;  // should be being defined upon room creation...
let nEditors = 0;
let turnIndex = 0;

// When a user connects, a Connection object will be created for them, which will use their socket to connect
// to the IO server. It sits there and handles events from their socket
class Connection {
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
  socket: Socket;

  // The constructor of the Connection class sets up callbacks on events coming from the socket.
  constructor(
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    socket: Socket
  ) {
    this.socket = socket;
    this.io = io;

    this.handleUser();

    socket.on("sendEachUserTheirInfo", () => this.sendEachUserTheirInfo());
    socket.on("sendUserInfo", () => this.sendUserInfo());

    socket.on("sendAllUserInfoToAll", () => this.sendAllUserInfoToAll());

    socket.on("allTurns", () => this.changeTurnsForAll());

    // The getLines event will be used by new clients to retrieve all existing finished lines from the server.
    socket.on("getLines", () => this.getLines());
    socket.on("getLineEdit", () => this.getLineEdit());

    // The line event will be triggered by the client whenever a new line has been submitted into the poem.
    socket.on("line", (value) => this.handleLine(value));

    // The lineEdit event will be triggered whenever the input box is edited.
    socket.on("lineEdit", (value) => this.handleLineEdit(value));

    socket.on("poemDone", () => this.poemDone());
    socket.on("clearLines", () => this.clearLines());
    socket.on("getPoems", () => this.getPoems());

    // The disconnect and connection_error are predefined events
    // that are triggered when the socket disconnects, or when an error happens during the connection.
    socket.on("disconnect", () => this.disconnect());
    socket.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.line}`);
    });
  }

  // Handle the initial arrival of the user
  // triggers a role-check
  handleUser() {

    users.set(this.socket, {
      id: uuidv4(),
      name: randomUserNames.pop(),
      color: randomColors.pop(),
      turn: null,
      role: null,
    });

    this.assignRolesOnPrinciples();
  }

  disconnect() {
    const thisUserInfo = users.get(this.socket);
    console.log(thisUserInfo, "headed out");

    randomUserNames.push(thisUserInfo.name);
    randomColors.push(thisUserInfo.color);
    users.delete(this.socket);

    // update the user roles
    this.assignRolesOnPrinciples();
    this.sendEachUserTheirInfo();
    this.sendAllUserInfoToAll();
  }

  assignRolesOnPrinciples() {
    let turnCounter = 0;
    nEditors = Math.min(users.size, maxEditors);
    console.log("assigning roles for", nEditors);
    for (let userInfoObj of users.values()) {
      userInfoObj["turn"] = turnCounter;
      if (turnCounter === turnIndex) {
        userInfoObj["role"] = "activeEditor";
        userInfoObj["turnsAway"] = 0;
      } else if (turnCounter < maxEditors) {
        userInfoObj["role"] = "inactiveEditor";
        userInfoObj["turnsAway"] = (turnCounter - turnIndex + nEditors) % nEditors;
      } else {
        userInfoObj["role"] = "spectator";
        userInfoObj["turnsAway"] = undefined;
      }
      turnCounter += 1;
    }
  }

  // to be critical: there are multiple pieces of the app that listen for this
  sendEachUserTheirInfo() {
    for (const [key, value] of users.entries()) {
      this.io.to(key.id).emit("userInfo", value);
    }
  }

  sendAllUserInfoToAll() {
    console.log("sendAllUserInfoToAll reached");
    this.io.sockets.emit("allUserInfo", Array.from(users.values()));
  }

  sendUserInfo() {
    console.log("sendUserInfo reached for", this.socket.id);
    this.io.to(this.socket.id).emit("userInfo", users.get(this.socket));
  }

  changeTurnsForAll() {
    console.log("turn was passed");
    turnIndex = (turnIndex + 1) % nEditors; // cycles through 0 up to nEditors - 1
    this.assignRolesOnPrinciples();
    this.sendEachUserTheirInfo();
    this.sendAllUserInfoToAll();
  }

  // When a new line arrives from this Connection, handleMessage() creates a line object and adds it to lines
  handleLine(value: ILine["value"]) {
    const line: ILine = {
      id: uuidv4(),
      user: users.get(this.socket) || defaultUser,
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
    this.io.sockets.emit("line", line);
  }

  getLines() {
    lines.forEach((line) => this.sendLine(line));
  }

  clearLines() {
    this.io.emit("clearLines");
  }

  // this is used to bring a new user up to date on what's happening in the lineEdit
  getLineEdit() {
    this.io.to(this.socket.id).emit("lineEdit", lineEditCurrentVal);
  }

  handleLineEdit(value: string) {
    this.socket.broadcast.emit("lineEdit", value);
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
    this.io.sockets.emit("poem", poem);
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
