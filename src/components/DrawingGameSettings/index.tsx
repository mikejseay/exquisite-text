import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import * as React from "react";

import {
    emitAlterGameSettings,
    emitRequestGameSettingsInfo,
    emitRequestSettingsEnabled,
    emitStartGame,
} from "../../context/SocketRequestors";
import { useSocketInfo } from "../../context/SocketInfoProvider";

export default function DrawingGameSettings() {
    const {
        settingsEnabled,
        nDrawings,
        setNDrawings,
    } = useSocketInfo();

    if (settingsEnabled === null) {
        return null;
    }

    // TODO: refactor by giving info before navigating user to Lobby route
    const [ rendered, setRendered ] = React.useState(false);
    if (!rendered) {
        emitRequestSettingsEnabled();
        emitRequestGameSettingsInfo();
        setRendered(true);
    }

    const handleNDrawings = (event: React.MouseEvent<HTMLElement>, nDrawings: number) => {
        if (!nDrawings)  {
            return;
        }
        setNDrawings(nDrawings);
        emitAlterGameSettings({ nDrawings });
    };

    const handlePressStartGameButton = () => {
        emitStartGame();
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
                    {"Drawings: "}
                    <ToggleButtonGroup
                        value={nDrawings}
                        exclusive
                        onChange={handleNDrawings}
                        disabled={false} // TODO: Get this working then enable this
                        // disabled={!settingsEnabled}
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

