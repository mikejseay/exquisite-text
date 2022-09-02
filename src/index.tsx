import * as React from "react";
import ReactDOM from "react-dom/client";
import {
    BrowserRouter,
    Route,
    Routes,
} from "react-router-dom";

import "./index.css";
import App from "./components/App";
import Game from "./screens/Game";
import Host from "./screens/Host";
import Join from "./screens/Join";
import Lobby from "./screens/Lobby";
import Library from "./screens/Library";
import Spectate from "./screens/Spectate";
import Disconnected from "./screens/Disconnected";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
const noMatchRouteElement = <main style={{ textAlign: "center" }}>
    <p>There&apos;s nothing here!</p>
</main>;

root.render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<App />}>

                {/* create socket on button press with successful room entry */}
                <Route path="/" element={<Join />} />

                {/* definitely creates socket and room */}
                <Route path="host" element={<Host />} />

                <Route path="library" element={<Library />} />
                {/* requires socket */}
                <Route path="lobby" element={<Lobby />} />
                <Route path="game" element={<Game />} />
                <Route path="spectate" element={<Spectate />} />
                <Route path="disconnected" element={<Disconnected />} />
                <Route  // no match route
                    path="*"
                    element={noMatchRouteElement}
                />
            </Route>
        </Routes>
    </BrowserRouter>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
