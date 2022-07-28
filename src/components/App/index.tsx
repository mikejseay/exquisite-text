import {
  useEffect,
  useState
} from "react";
import {
  io,
  Socket
} from "socket.io-client";
import Poems from "../Poems";
import LineInput from "../LineInput";
import GameState from "../GameState";
import Tutorial from "../Tutorial";
import Settings from "../Settings";
import Menu from "../Menu";
import {
  appHeader,
  appBody,
  appTitle,
  app,
  possibleSocket
} from "./styles";
import type {
  ClientToServerEvents,
  ServerToClientEvents
} from "../../types";

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
const serverPath: URL["pathname"] | URL["href"] = isDevelopment
  ? `http://${window.location.hostname}:3000`
  : `/`;

function App() {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  useEffect(() => {
    const newSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io(serverPath);
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [setSocket]);

  // The component then renders a page that contains a header.
  // If a socket has already been established, it will also render two components Lines and LineInput.
  // Both of these components need the socket to work, so it is being passed in as a parameter.
  if (!socket) {
    return <div>Not Connected</div>;
  }

  return (
    <div style={possibleSocket}>
      <div style={app}>
        <header style={appHeader}>
          <Menu />
          <Tutorial />
          <div style={appTitle}>Exquisite Text</div>
          <GameState socket={socket} />
          <Settings />
        </header>
        <div style={appBody}>
          <LineInput socket={socket} />
          <Poems socket={socket} />
        </div>
      </div>
    </div>
  );
}

export default App;
