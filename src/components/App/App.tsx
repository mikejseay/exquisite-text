import Paper from "@mui/material/Paper";
import { app, appHeader, appTitle, possibleSocket } from "components/App/styles";
import { LandscapeBanner } from "components/LandscapeBanner/LandscapeBanner";
import { MenuButtons } from "components/MenuButtons/MenuButtons";
import { emitRecognizeDevice } from "context/SocketRequestors";
import { Outlet } from "react-router-dom";

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
