import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import * as React from "react";

import { LineLength } from "../../types";
import {
    requestAlterGameSettings,
    requestGetGameSettingsInfo,
    requestGetSettingsEnabled,
    requestStartGame,
} from "../../context/SocketRequestors";
import { useSocketInfo } from "../../context/SocketInfoProvider";

function GameSettings() {

    const {
        settingsEnabled,
        lineLength,
        nRounds,
        nPoems,
        setLineLength,
        setNRounds,
        setNPoems,
    } = useSocketInfo();
    if (settingsEnabled === null) {
        return null;
    }

    const [ rendered, setRendered ] = React.useState(false);
    if (!rendered) {
        requestGetSettingsEnabled();
        requestGetGameSettingsInfo();
        setRendered(true);
    }

    // these will only ever take place for the VIP editor
    const handleLineLength = (event: React.MouseEvent<HTMLElement>, newLineLength: LineLength) => {
        if (!newLineLength || !nPoems || !nRounds)  {
            return;
        }
        setLineLength(newLineLength);
        requestAlterGameSettings(newLineLength, nPoems, nRounds);
    };

    const handleNRounds = (event: React.MouseEvent<HTMLElement>, newNRounds: number) => {
        if (!lineLength || !nPoems || !newNRounds)  {
            return;
        }
        setNRounds(newNRounds);
        requestAlterGameSettings(lineLength, nPoems, newNRounds);
    };

    const handleNPoems = (event: React.MouseEvent<HTMLElement>, newNPoems: number) => {
        if (!lineLength || !newNPoems || !nRounds)  {
            return;
        }
        setNPoems(newNPoems);
        requestAlterGameSettings(lineLength, newNPoems, nRounds);
    };

    const handlePressStartGameButton = () => {
        requestStartGame();
    };

    return (
        <div className={"gameSettings"} style={{ textAlign: "center" }}>
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
