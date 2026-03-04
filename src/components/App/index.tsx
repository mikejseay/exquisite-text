import Paper from "@mui/material/Paper";
import * as React from "react";
import { Outlet } from "react-router-dom";
import { MenuButtons } from "../MenuButtons";
import {
    app,
    appHeader,
    appTitle,
    possibleSocket,
} from "./styles";
import { emitRecognizeDevice } from "../../context/SocketRequestors";

export default function App() {
    emitRecognizeDevice();
    return (
        <div style={possibleSocket} className={"possible-socket"}>
            <Paper elevation={0} style={app} className={"app-container"}>
                <header style={appHeader}>
                    <MenuButtons />
                    <h1 style={appTitle}>Exquisite Text</h1>
                </header>
                <Outlet />
            </Paper>
        </div>
    );
}
