import React, { useState, useEffect } from "react";
import {
  lineStyle,
  lineContainer,
} from "./styles";
import type {
  ILine,
  ILines,
} from "../../types";
import { useSocket } from "../App";

const Lines = () => {
  const { socket } = useSocket();

  // The lines state is a plain object that contains each line indexed by the line ID.
  // Using React hooks, this state is updated inside the event handlers to reflect the changes provided by the server.
  const [lines, setLines] = useState<ILines>({});

  useEffect(() => {
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

    socket.on("line", lineListener);
    socket.on("clearLines", clearLineListener);

    // tells the server for this client to do getLines
    // since this is client-side, it only happens for this client
    socket.emit("getLines");

    return () => {
      socket.off("line", lineListener);
      socket.off("clearLines", clearLineListener);
    };
  }, [socket]);

  return (
    <div className="lines-outer-container">
      <div className="lines-container">
        {[...Object.values(lines)]
          .sort((a, b) => Number(a.createdAt) - Number(b.createdAt))
          .map((line) => (
            <div
              className="line-container"
              key={line.id}
              style={lineContainer}
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
};

export default Lines;
