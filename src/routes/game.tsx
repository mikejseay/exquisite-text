import React from "react";
import LineInput from "../components/LineInput";
import Poems from "../components/Poems";

const appBody: React.CSSProperties = {
  alignItems: "center",
  height: "calc(100vh - 60px)",
  display: "flex",
  flexDirection: "column",
  fontFamily: "'Esteban', serif",
  fontSize: "18px",
  flexWrap: "nowrap",
  justifyContent: "flex-start",
  width: "99vw",
};

function Game() {
  return (
    <div style={appBody}>
      <LineInput />
      <Poems />
    </div>
  );
}

export default Game;
