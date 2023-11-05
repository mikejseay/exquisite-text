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
import { recognizeDevice } from "../../context/SocketRequestors";

export default function App() {
    recognizeDevice();
    return (
        <div style={possibleSocket} className={"possible-socket"}>
            <Paper elevation={0} style={app} className={"app-container"}>
                <header style={appHeader}>
                    <MenuButtons />
                    <div style={appTitle}>Exquisite Text</div>
                </header>
                <Outlet />
            </Paper>
        </div>
    );
}
