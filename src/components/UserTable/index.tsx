import React, { useEffect, useState } from "react";
import {
  IUserTableInfo
} from "../../types";
import { useSocket } from "../App";

function UserTable() {
  const { socket } = useSocket();

  const [editorArr, setEditorArr] = useState<Array<string>>([]);
  const [spectatorArr, setSpectatorArr] = useState<Array<string>>([]);

  // listen for arrays of editors and spectators
  useEffect(() => {

    // Event handlers for the line and the deleteLine events are set up for the Socket.IO connection.
    const userTableInfoListener = (info: IUserTableInfo) => {
      setEditorArr(info["editors"]);
      setSpectatorArr(info["spectators"]);
    };

    socket.on("userTableInfo", userTableInfoListener);
    socket.emit("getUserTableInfo"); // initial populate

    return () => {
      socket.off("userTableInfo", userTableInfoListener);
    };
  }, [socket]);

  return (
    <div className={"userTable"} style={{textAlign: "center"}}>
      <div className={"editors"}>
        <h2>Editors:</h2>
        {editorArr.map((name) => {
          return (
            <p>{name}</p>
          );
        })}
      </div>
      <div className={"spectators"}>
        <h2>Spectators:</h2>
        {spectatorArr.map((name) => {
          return (
            <p>{name}</p>
          );
        })}
      </div>
    </div>
  );
}

export default UserTable;
