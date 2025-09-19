import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import * as React from "react";

import { LineLength } from "../../types";
import {
    emitAddPoemBot,
    emitAlterGameSettings,
    emitRequestGameSettingsInfo,
    emitRequestSettingsEnabled,
    emitStartGame,
} from "../../context/SocketRequestors";
import { useSocketInfo } from "../../context/SocketInfoProvider";

function PoemGameSettings() {
    const {
        settingsEnabled,
        lineLength,
        nRounds,
        nPoems,
        setLineLength,
        setNRounds,
        setNPoems,
        userInfo,
    } = useSocketInfo();

    if (settingsEnabled === null || userInfo === null) {
        return null;
    }

    const [ rendered, setRendered ] = React.useState(false);
    if (!rendered) {
        emitRequestSettingsEnabled();
        emitRequestGameSettingsInfo();
        setRendered(true);
    }

    // extract editors data from userInfo to determine whether room is full
    const { editors } = userInfo;

    // these will only ever take place for the VIP editor
    const handleLineLength = (event: React.MouseEvent<HTMLElement>, newLineLength: LineLength) => {
        if (!nPoems || !nRounds || !newLineLength)  {
            return;
        }
        setLineLength(newLineLength);
        emitAlterGameSettings({ lineLength: newLineLength, nPoems, nRounds });
    };

    const handleNRounds = (event: React.MouseEvent<HTMLElement>, newNRounds: number) => {
        if (!lineLength || !nPoems || !newNRounds)  {
            return;
        }
        setNRounds(newNRounds);
        emitAlterGameSettings({ lineLength, nPoems, nRounds: newNRounds });
    };

    const handleNPoems = (event: React.MouseEvent<HTMLElement>, newNPoems: number) => {
        if (!lineLength || !newNPoems || !nRounds)  {
            return;
        }
        setNPoems(newNPoems);
        emitAlterGameSettings({ lineLength, nPoems: newNPoems, nRounds });
    };

    const handlePressStartGameButton = () => {
        emitStartGame();
    };

    const handlePressAddBotButton = () => {
        emitAddPoemBot();
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
                        <ToggleButton value={LineLength.SHORT}>Short</ToggleButton>
                        <ToggleButton value={LineLength.LONG}>Long</ToggleButton>
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
                    disabled={!settingsEnabled || editors.length >= 4}
                    onClick={handlePressAddBotButton}
                    variant="contained"
                >
                        Add Bot
                </Button>

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

export default PoemGameSettings;
