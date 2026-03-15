import Paper from "@mui/material/Paper";
import * as React from "react";
import { Outlet } from "react-router-dom";
import { LandscapeBanner } from "../LandscapeBanner";
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
                <LandscapeBanner />
                <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                    <Outlet />
                </div>
            </Paper>
        </div>
    );
}
