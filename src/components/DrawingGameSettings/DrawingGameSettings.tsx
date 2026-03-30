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

    const settingRow: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        width: "100%",
    };
    const settingLabel: React.CSSProperties = { textAlign: "left", minWidth: 100 };

    return (
        <div className={"gameSettings"} style={textCentered}>
            <Stack
                spacing={2}
                direction="column"
                style={{
                    alignItems: "center",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 12,
                    padding: "1rem 1.5rem",
                }}
            >
                <h2 style={{ marginTop: 0 }}>Game Settings</h2>
                <div style={settingRow}>
                    <span style={settingLabel}>Drawings</span>
                    <ToggleButtonGroup
                        value={nDrawings}
                        exclusive
                        onChange={handleNDrawings}
                        disabled={!settingsEnabled}
                        sx={{ width: 200, "& .MuiToggleButton-root": { flex: 1 } }}
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
