import React, { useEffect, useState } from "react";
import {
  IUserTableInfo
} from "../../types";
import { useSocket } from "../App";

function UserTable() {
  const { socket } = useSocket();

  const [userTableInfo, setUserTableInfo] = useState<IUserTableInfo>(
    {editors: [], spectators: []}
  );

  // listen for arrays of editors and spectators
  useEffect(() => {

    // Event handlers for the line and the deleteLine events are set up for the Socket.IO connection.
    const userTableInfoListener = (info: IUserTableInfo) => {
      setUserTableInfo(info);
    };

    socket.on("userTableInfo", userTableInfoListener);
    socket.emit("getUserTableInfo");

    return () => {
      socket.off("userTableInfo", userTableInfoListener);
    };
  }, [socket]);

  return (
    <div className={"userTable"} style={{textAlign: "center"}}>
      <div className={"editors"}>
        <h2>Editors:</h2>
        {userTableInfo["editors"].map((name) => {
          return (
            <p>{name}</p>
          );
        })}
      </div>
      <div className={"spectators"}>
        <h2>Spectators:</h2>
        {userTableInfo["spectators"].map((name) => {
          return (
            <p>{name}</p>
          );
        })}
      </div>
    </div>
  );
}

export default UserTable;
