import React, { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  ILine,
  ILines,
  IUserInfo,
  ServerToClientEvents,
} from "../../types";
import {
  lineStyle,
} from "./styles";

// if activeEditor or inactiveEditor, NOTHING is visible here until the end
// if spectator, EVERYTHING is visible here

function Lines({
  socket,
}: {
  socket: Socket<ServerToClientEvents, ClientToServerEvents>,
}) {
  // The lines state is a plain object that contains each line indexed by the line ID.
  // Using React hooks, this state is updated inside the event handlers to reflect the changes provided by the server.
  const [lines, setLines] = useState<ILines>({});

  const [linesVisible, setLinesVisible] = useState(false);

  useEffect(() => {
    // Event handlers for the line and the deleteLine events are set up for the Socket.IO connection.
    const lineListener = (line: ILine) => {
      setLines((prevLines) => {
        const newLines = { ...prevLines };
        newLines[line.id] = line;
        return newLines;
      });
    };

    const clearLineListener = () => {
      setLines({});
    };

    const userInfoListener = (userInfo: IUserInfo) => {
      if (userInfo["role"] === "activeEditor") {
        setLinesVisible(false);
      } else if (userInfo["role"] === "inactiveEditor") {
        setLinesVisible(false);
      } else if (userInfo["role"] === "spectator") {
        setLinesVisible(true);
      }
    };

    socket.on("userInfo", userInfoListener);
    socket.on("line", lineListener);
    socket.on("clearLines", clearLineListener);

    // tells the server for this client to do getLines
    // since this is client-side, it only happens for this client
    socket.emit("getLines");

    return () => {
      socket.off("userInfo", userInfoListener);
      socket.off("line", lineListener);
      socket.off("clearLines", clearLineListener);
    };
  }, [socket]);

  if (!linesVisible) {
    return <React.Fragment />;
  }

  return (
    // The component then displays all lines sorted by the timestamp at which they were created.
    // we can switch this so that it renders previous lines according to a view
    <div className="lines-outer-container">
      <div className="lines-container">
        {[...Object.values(lines)]
          .sort((a, b) => Number(a.createdAt) - Number(b.createdAt))
          .map((line) => (
            <div
              className="line-container"
              key={line.id}
            >
              <div
                className="line"
                style={lineStyle}
              >
                {line.value}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default Lines;
