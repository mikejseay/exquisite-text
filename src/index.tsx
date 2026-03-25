import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import * as React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import "./index.css";
import App from "components/App/App";
import { ErrorBoundary } from "components/ErrorBoundary/ErrorBoundary";
import SocketHandler from "components/SocketHandler/SocketHandler";
import Canvas from "screens/Canvas/Canvas";
import CanvasSpectator from "screens/CanvasSpectator/CanvasSpectator";
import Disconnected from "screens/Disconnected/Disconnected";
import End from "screens/End/End";
import Game from "screens/Game/Game";
import Join from "screens/Join/Join";
import Lobby from "screens/Lobby/Lobby";
import Spectate from "screens/Spectate/Spectate";
import { getTheme } from "theme";
import { Medium } from "types/types";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
const noMatchRouteElement = (
    <main style={{ textAlign: "center" }}>
        <p>There&apos;s nothing here!</p>
    </main>
);

function ThemeWrapper({ children }: { children: React.ReactNode }) {
    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

    const theme = React.useMemo(() => getTheme(prefersDarkMode ? "dark" : "light"), [prefersDarkMode]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
}

function Root() {
    return (
        <ThemeWrapper>
            <ErrorBoundary>
                <BrowserRouter>
                    <SocketHandler>
                        <Routes>
                            <Route path="/" element={<App />}>
                                <Route path="/" element={<Join />} />
                                <Route path="lobby" element={<Lobby />} />
                                <Route path="game" element={<Game />} />
                                <Route path="spectate" element={<Spectate />} />
                                <Route path="end" element={<End />} />
                                <Route path="endtestpoem" element={<End testingMedium={Medium.POETRY} />} />
                                <Route path="endtestdrawing" element={<End testingMedium={Medium.DRAWING} />} />
                                <Route path="canvas" element={<Canvas />} />
                                <Route path="canvasspectator" element={<CanvasSpectator />} />
                                <Route path="disconnected" element={<Disconnected />} />

                                <Route path="/:id" element={<Join />} />
                                <Route // no match route
                                    path="*"
                                    element={noMatchRouteElement}
                                />
                            </Route>
                        </Routes>
                    </SocketHandler>
                </BrowserRouter>
            </ErrorBoundary>
        </ThemeWrapper>
    );
}

root.render(<Root />);
