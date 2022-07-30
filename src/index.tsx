import ReactDOM from 'react-dom/client';
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";
import './index.css';
import App from './components/App';
import Host from "./routes/host"
import Join from "./routes/join"
import Lobby from "./routes/lobby"
import Game from "./routes/game"
import Spectate from "./routes/spectate"
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <BrowserRouter>
    <Routes>
      {/*<Route path="/" element={<App />} />*/}
      <Route path="/" element={<App />}>
        <Route path="/" element={<Join />} />
        <Route path="host" element={<Host />} />
        <Route path="lobby" element={<Lobby />} />
        <Route path="game" element={<Game />} />
        <Route path="spectate" element={<Spectate />} />
        <Route  // no match route
          path="*"
          element={
            <main style={{ textAlign: "center" }}>
              <p>There's nothing here!</p>
            </main>
          }
        />
      </Route>
    </Routes>
  </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
