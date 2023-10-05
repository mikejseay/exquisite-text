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

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
const noMatchRouteElement = <main style={{ textAlign: "center" }}>
    <p>There&apos;s nothing here!</p>
</main>;

function isComponentEnabled(element: JSX.Element): JSX.Element | null {
    return process.env.IS_LIBRARY_ENABLED === "true"
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
                <Routes>
                    <Route path="/" element={<App />}>

                        {/* create socket on button press with successful room entry */}
                        <Route path="/" element={<Join />} />

                        {/* definitely creates socket and room */}
                        {/* <Route path="host" element={<Host />} /> */}

                        {/* requires socket */}
                        <Route path="lobby" element={<Lobby />} />
                        <Route path="game" element={<Game />} />
                        <Route path="spectate" element={<Spectate />} />
                        <Route path="end" element={<End shouldTest={false} />} />
                        <Route path="endtest" element={<End shouldTest={true} />} />
                        <Route path="canvas" element={<Canvas />} />
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
