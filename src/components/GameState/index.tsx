import React, { useEffect, useState } from "react";
import Popover from "@mui/material/Popover";
import PeopleIcon from "@mui/icons-material/People";
import IconButton from "@mui/material/IconButton";
import { Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  IUserInfo,
  ServerToClientEvents,
} from "../../types";
import { marginLeftAuto } from "./styles";

function GameState({ socket }: { socket: Socket<ServerToClientEvents, ClientToServerEvents> }) {
  const [anchorEl, setAnchorEl] = React.useState<Element | null>(null);
  const handleClick = (event: { currentTarget: React.SetStateAction<Element | null> }) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [turn, setTurn] = useState(0);
  const [usersArr, setUsersArr] = useState<Array<IUserInfo>>([]);

  useEffect(() => {
    // Event handlers for the line and the deleteLine events are set up for the Socket.IO connection.
    const userInfoListener = (userInfo: {
      ["name"]: React.SetStateAction<string>;
      ["role"]: React.SetStateAction<string>;
      ["turn"]: React.SetStateAction<number>;
    }) => {
      setName(userInfo["name"]);
      setRole(userInfo["role"]);
      setTurn(userInfo["turn"]);
    };

    // Event handlers for the line and the deleteLine events are set up for the Socket.IO connection.
    const allUserInfoListener = (allUserInfo: React.SetStateAction<Array<IUserInfo>>) => {
      setUsersArr(allUserInfo);
    };

    socket.on("userInfo", userInfoListener);
    socket.on("allUserInfo", allUserInfoListener);

    // send only this user their info to initially set them up
    // note that there is a userInfoListener in GameState and LineInput
    // is that bad?
    socket.emit("sendUserInfo");

    // get initial info (must update after any turn change)
    socket.emit("sendAllUserInfoToAll");

    return () => {
      socket.off("userInfo", userInfoListener);
      socket.off("allUserInfo", allUserInfoListener);
    };
  }, [socket]);

  return (
    <div style={marginLeftAuto}>
        <IconButton
          aria-label="players"
          onClick={handleClick}
          size={"large"}
        >
          <PeopleIcon />
        </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <div className={"user-info"}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Turn</th>
                <th>TurnsAway</th>
                <th>You?</th>
              </tr>
            </thead>
            <tbody>
              {usersArr.map((val) => {
                return (
                  <tr key={val.id}>
                    <td>{val.name}</td>
                    <td>{val.role}</td>
                    <td>{val.turn}</td>
                    <td>{val.turnsAway}</td>
                    <td>{val.turn === turn ? "yes" : "no"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p>
            Your name is {name}, your role is {role}, and your turn is {turn}.
          </p>
        </div>
      </Popover>
    </div>
  );
}

export default GameState;
