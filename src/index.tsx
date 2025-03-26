import useMediaQuery from "@mui/material/useMediaQuery";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import * as React from "react";
import ReactDOM from "react-dom/client";
import {
    BrowserRouter,
    Route,
    Routes,
} from "react-router-dom";

import "./index.css";
import App from "./components/App";
import End from "./screens/End";
import Game from "./screens/Game";
// import Host from "./screens/Host";
import Join from "./screens/Join";
import Library from "./screens/Library";
import Page from "./screens/Page";
import Lobby from "./screens/Lobby";
import Spectate from "./screens/Spectate";
import Disconnected from "./screens/Disconnected";
import Canvas from "./screens/Canvas";
import reportWebVitals from "./reportWebVitals";
import SocketHandler from "./components/SocketHandler";
import CanvasSpectator from "./screens/CanvasSpectator";
import { Medium } from "./types";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
const noMatchRouteElement = <main style={{ textAlign: "center" }}>
    <p>There&apos;s nothing here!</p>
</main>;

function isComponentEnabled(element: JSX.Element): JSX.Element | null {
    return process.env.REACT_APP_IS_LIBRARY_ENABLED === "true"
        ? element
        : null;
}

function Root() {
    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

    const theme = React.useMemo(
        () =>
            createTheme({
                palette: {
                    mode: prefersDarkMode
                        ? "dark"
                        : "light",
                },
            }),
        [ prefersDarkMode ],
    );

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
                <SocketHandler>
                    <Routes>
                        <Route path="/" element={<App />}>

                            <Route path="/" element={<Join />} />
                            {/* <Route path="host" element={<Host />} /> */}
                            <Route path="lobby" element={<Lobby />} />
                            <Route path="game" element={<Game />} />
                            <Route path="spectate" element={<Spectate />} />
                            <Route path="end" element={<End />} />
                            <Route path="endtestpoem" element={<End testingMedium={Medium.POETRY} />} />
                            <Route path="endtestdrawing" element={<End testingMedium={Medium.DRAWING} />} />
                            <Route path="canvas" element={<Canvas />} />
                            <Route path="canvasspectator" element={<CanvasSpectator />} />
                            {isComponentEnabled(<Route path="library" element={<Library />} />)}
                            {isComponentEnabled(<Route path="page/:id" element={<Page />} />)}
                            <Route path="disconnected" element={<Disconnected />} />

                            <Route path="/:id" element={<Join />} />
                            <Route  // no match route
                                path="*"
                                element={noMatchRouteElement}
                            />
                        </Route>
                    </Routes>
                </SocketHandler>
            </BrowserRouter>
        </ThemeProvider>
    );
}

root.render(
    <Root />,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
