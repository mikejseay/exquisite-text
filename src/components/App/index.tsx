import {
  useEffect,
  useState
} from "react";
import {
  io,
  Socket
} from "socket.io-client";
import { Outlet, useOutletContext } from "react-router-dom";
import GameState from "../GameState";
import Tutorial from "../Tutorial";
import Settings from "../Settings";
import Menu from "../Menu";
import {
  appHeader,
  appTitle,
  app,
  possibleSocket
} from "./styles";
import type {
  ClientToServerEvents,
  ServerToClientEvents
} from "../../types";
const uuidv4 = require("uuid").v4;

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
const serverPath: URL["pathname"] | URL["href"] = isDevelopment
  ? `http://${window.location.hostname}:3000`
  : `/`;

type ContextType = { socket: Socket<ServerToClientEvents, ClientToServerEvents> };

export default function App() {
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

  // check if this device (browser) has visited the page before
  // const firstVisit = !localStorage.getItem('device');
  // if (firstVisit) {
  //   localStorage.setItem('device', uuidv4());
  // }
  // socket.emit("recognizeDevice", localStorage.getItem('device'));

  // to debug I will send a random device id each time
  socket.emit("recognizeDevice", uuidv4());


  return (
    <div style={possibleSocket}>
      <div style={app}>
        <header style={appHeader}>
          <Menu />
          <Tutorial />
          <div style={appTitle}>Exquisite Text</div>
          <GameState />
          <Settings />
        </header>
        <Outlet context={{ socket }}/>
      </div>
    </div>
  );
}

export function useSocket() {
  return useOutletContext<ContextType>();
}
