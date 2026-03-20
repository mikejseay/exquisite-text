import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useSocketInfo } from "context/SocketInfoProvider";

import { emitAlterGameSettings, emitStartGame } from "context/SocketRequestors";
import { useInitializeGameSettings } from "hooks/useInitializeGameSettings";
import type * as React from "react";
import { textCentered } from "styles/common";

export default function DrawingGameSettings({ hideStartButton = false }: { hideStartButton?: boolean }) {
    const { settingsEnabled, nDrawings, setNDrawings } = useSocketInfo();

    useInitializeGameSettings();

    if (settingsEnabled === null) {
        return null;
    }

    const handleNDrawings = (_event: React.MouseEvent<HTMLElement>, nDrawings: number) => {
        if (!nDrawings) {
            return;
        }
        setNDrawings(nDrawings);
        emitAlterGameSettings({ nDrawings });
    };

    const handlePressStartGameButton = () => {
        emitStartGame();
    };

    return (
        <div className={"gameSettings"} style={textCentered}>
            <h2>Game settings:</h2>
            <Stack spacing={2} direction="column" style={{ alignItems: "center" }}>
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

                {!hideStartButton && (
                    <Button disabled={!settingsEnabled} onClick={handlePressStartGameButton} variant="contained">
                        Start Game
                    </Button>
                )}
            </Stack>
        </div>
    );
}
