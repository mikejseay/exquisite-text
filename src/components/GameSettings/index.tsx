import * as React from 'react';
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Stack from "@mui/material/Stack";
import { useSocket } from "../App";
import Button from "@mui/material/Button";
import { useEffect } from "react";
import { IGameSettingsInfo } from "../../types";

function GameSettings() {
  const { socket } = useSocket();

  const [settingsEnabled, setSettingsEnabled] = React.useState<boolean>(false);
  const [lineLength, setLineLength] = React.useState<string>('short');
  const [nRounds, setNRounds] = React.useState<number>(2);
  const [nPoems, setNPoems] = React.useState<number>(1);

  // these will only ever take place for the VIP editor
  const handleLineLength = (event: React.MouseEvent<HTMLElement>, newLineLength: string) => {
    setLineLength(newLineLength);
    socket.emit("alterGameSettings", {lineLength: newLineLength, nRounds: nRounds, nPoems: nPoems});
  };
  const handleNRounds = (event: React.MouseEvent<HTMLElement>, newNRounds: number) => {
    setNRounds(newNRounds);
    socket.emit("alterGameSettings", {lineLength: lineLength, nRounds: newNRounds, nPoems: nPoems});
  };
  const handleNPoems = (event: React.MouseEvent<HTMLElement>, newNPoems: number) => {
    setNPoems(newNPoems);
    socket.emit("alterGameSettings", {lineLength: lineLength, nRounds: nRounds, nPoems: newNPoems});
  };
  const handlePressStartGameButton = () => {
    socket.emit("startGame");
  };

  // listen for arrays of editors and spectators
  useEffect(() => {

    // Event handlers for the line and the deleteLine events are set up for the Socket.IO connection.
    const gameSettingsInfoListener = (info: IGameSettingsInfo) => {
      setLineLength(info["lineLength"]);
      setNRounds(info["nRounds"]);
      setNPoems(info["nPoems"]);
    };

    const gameSettingsEnabledListener = (enabled: boolean) => {
      setSettingsEnabled(enabled);
    };

    socket.on("gameSettingsInfo", gameSettingsInfoListener);
    socket.on("gameSettingsEnabled", gameSettingsEnabledListener);

    socket.emit("getSettingsEnabled");   // initial populate
    socket.emit("getGameSettingsInfo");  // initial populate

    return () => {
      socket.off("gameSettingsInfo", gameSettingsInfoListener);
      socket.off("gameSettingsEnabled", gameSettingsEnabledListener);
    };
  }, [socket]);

  return (
    <div className={"gameSettings"} style={{textAlign: "center"}}>
      <h2>Game settings:</h2>
      <Stack
        spacing={2}
        direction="column"
        style={{ alignItems: "center" }}
      >
        <div>
          {"Line Length: "}
          <ToggleButtonGroup
            value={lineLength}
            exclusive
            onChange={handleLineLength}
            disabled={!settingsEnabled}
          >
            <ToggleButton value="short">Short</ToggleButton>
            <ToggleButton value="long">Long</ToggleButton>
          </ToggleButtonGroup>
        </div>

        <div>
          {"Rounds: "}
          <ToggleButtonGroup
            value={nRounds}
            exclusive
            onChange={handleNRounds}
            disabled={!settingsEnabled}
          >
            <ToggleButton value={2}>2</ToggleButton>
            <ToggleButton value={3}>3</ToggleButton>
            <ToggleButton value={4}>4</ToggleButton>
          </ToggleButtonGroup>
        </div>

        <div>
          {"Poems: "}
          <ToggleButtonGroup
            value={nPoems}
            exclusive
            onChange={handleNPoems}
            disabled={!settingsEnabled}
          >
            <ToggleButton value={1}>1</ToggleButton>
            <ToggleButton value={2}>2</ToggleButton>
            <ToggleButton value={3}>3</ToggleButton>
            <ToggleButton value={4}>4</ToggleButton>
          </ToggleButtonGroup>
        </div>

        <Button
          disabled={!settingsEnabled}
          onClick={handlePressStartGameButton}
          variant="contained"
        >
          Start Game
        </Button>
      </Stack>
    </div>
  );
}

export default GameSettings;
