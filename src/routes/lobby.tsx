import UserTable from "../components/UserTable";
import GameSettings from "../components/GameSettings";
import GameTransition from "../components/GameTransition";
import React from "react";

function Lobby() {
  return (
    <div >
      <UserTable />
      <GameSettings />
      <GameTransition />
    </div>
  );
}

export default Lobby;
