#!/usr/bin/env node

import { Server } from "socket.io";

import type {
    ClientToServerEvents,
    InterServerEvents,
    ServerToClientEvents,
    SocketData,
} from "../src/types";

import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });

// import the http library
import { createServer } from "http";

// const privateKey   = fs.readFileSync("./.cert/key.pem", "utf8");
// const certificate  = fs.readFileSync("./.cert/cert.pem", "utf8");
// const credentials = {key: privateKey, cert: certificate};

// app assembles the two routers and creates the express app and does its basic configuration
import app from "./app";
// "poem" contains the logic for the poem application
import sockets from "./modules/sockets";

import debug0 from "debug";
import isNil from "lodash/isNil";

/**
 * Module dependencies.
 */

// no ideas... chat-server is the name in package.json?
const debug = debug0("chat-server:server");

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

/**
 * Create HTTP server.
 */

// the http server that will listen on the port given by the app
const httpServer = createServer(app);
// const server = https.createServer(credentials, app);

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
    cors: {
        methods: [ "GET", "POST" ],
        origin: "*",
    },
});

// the socket.io server which will handle socket-based messages
// in production, you might want to only allow certain clients

// runs the functionality defined in sockets.ts, which takes the io server as input,
// and tells it how to handle socket events
sockets(io);

/**
 * Listen on provided port, on all network interfaces.
 */

// the server listens on the port for any incoming connections and maintains the connection
httpServer.listen(port);
httpServer.on("error", onError);
httpServer.on("listening", onListening);

// the below defines functions which are used above, they are mostly boilerplate and not necessary to read

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string) {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
    // named pipe
        return val;
    }

    if (port >= 0) {
    // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: { syscall: string; code: string }) {
    if (error.syscall !== "listen") {
        throw error;
    }

    const bind = typeof port === "string"
        ? "Pipe " + port
        : "Port " + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
    case "EACCES":
        console.error(bind + " requires elevated privileges");
        process.exit(1);
        break;
    case "EADDRINUSE":
        console.error(bind + " is already in use");
        process.exit(1);
        break;
    default:
        throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    const address = httpServer.address();
    if (!isNil(address)) {
        const bind =
      typeof address === "string"
          ? "pipe " + address
          : "port " + address.port;
        debug("Listening on " + bind);
    }
}

export {};
