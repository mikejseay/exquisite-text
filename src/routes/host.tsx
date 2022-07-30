import { useSocket } from "../components/App";
import UserTable from "../components/UserTable";
import GameSettings from "../components/GameSettings";
import React from "react";

export default function Host() {
  const { socket } = useSocket();

  const rootURL = window.location.host;
  const gameCode = generateAlphaString(4);

  socket.emit("createGameHost", gameCode);

  function generateAlphaString(stringLength: number) {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const charactersLength = characters.length;
    for (let i = 0; i < stringLength; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  return (
    <main style={{ textAlign: "center" }}>
      <h2>{"Go to " + rootURL}</h2>
      <h2>{"Enter room code: " + gameCode}</h2>
      <UserTable />
      <GameSettings />
    </main>
  );
}
