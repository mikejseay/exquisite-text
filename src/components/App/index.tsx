import isNil from "lodash/isNil";
import * as React from "react";
import {
    Outlet,
    useOutletContext,
} from "react-router-dom";
import {
    io,
    Socket,
} from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

import Tutorial from "../Tutorial";
// import Menu from "../Menu";
import {
    appHeader,
    appTitle,
    app,
    possibleSocket,
} from "./styles";

import type {
    ClientToServerEvents,
    ServerToClientEvents,
} from "../../types";
import Paper from "@mui/material/Paper";


const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
const serverPath: URL["pathname"] | URL["href"] = isDevelopment
    ? `http://${window.location.hostname}:3000`
    : "/";

type ContextType = { socket: Socket<ServerToClientEvents, ClientToServerEvents> };

export default function App() {
    const [ socket, setSocket ] = React.useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

    React.useEffect(() => {
        const newSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io(serverPath);
        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [ setSocket ]);

    // The component then renders a page that contains a header.
    // If a socket has already been established, it will also render two components Lines and LineInput.
    // Both of these components need the socket to work, so it is being passed in as a parameter.
    if (!socket) {
        return <div>Not Connected</div>;
    }

    // set this to true if you want to be able to connect to the game
    // multiple times from the same browser
    if (process.env.REACT_APP_DEBUG_SINGLE_BROWSER === "true") {
        console.log("debug in single browser mode");
        // to debug I will send a random device id each time
        socket.emit("recognizeDevice", uuidv4());
    } else {
        // check if this device (browser) has visited the page before
        const firstVisit = !localStorage.getItem("device");
        if (firstVisit) {
            localStorage.setItem("device", uuidv4());
        }
        const deviceID = localStorage.getItem("device");
        if (!isNil(deviceID)) {
            socket.emit("recognizeDevice", deviceID);
        }
    }

    return (
        <div style={possibleSocket} className={"possible-socket"}>
            <Paper elevation={0} style={app} className={"app-container"}>
                <header style={appHeader}>
                    {/*<Menu />*/}
                    <Tutorial />
                    <div style={appTitle}>Exquisite Text</div>
                    {/*<GameState />*/}
                    {/*<Settings />*/}
                </header>
                <Outlet context={{ socket }} />
            </Paper>
        </div>
    );
}

export function useSocket() {
    return useOutletContext<ContextType>();
}
