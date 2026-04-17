import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useSocketInfo } from "context/SocketInfoProvider";
import { emitAlterGameSettings, emitStartGame } from "context/SocketRequestors";
import { useInitializeGameSettings } from "hooks/useInitializeGameSettings";
import type * as React from "react";
import { textCentered } from "styles/common";
import { LineLength } from "types/types";

function PoemGameSettings({ hideStartButton = false }: { hideStartButton?: boolean }) {
    const { settingsEnabled, lineLength, nRounds, nPoems, setLineLength, setNRounds, setNPoems } = useSocketInfo();

    useInitializeGameSettings();

    if (settingsEnabled === null) {
        return null;
    }

    // these will only ever take place for the VIP editor
    const handleLineLength = (_event: React.MouseEvent<HTMLElement>, newLineLength: LineLength) => {
        if (!nPoems || !nRounds || !newLineLength) {
            return;
        }
        setLineLength(newLineLength);
        emitAlterGameSettings({ lineLength: newLineLength, nPoems, nRounds });
    };

    const handleNRounds = (_event: React.MouseEvent<HTMLElement>, newNRounds: number) => {
        if (!lineLength || !nPoems || !newNRounds) {
            return;
        }
        setNRounds(newNRounds);
        emitAlterGameSettings({ lineLength, nPoems, nRounds: newNRounds });
    };

    const handleNPoems = (_event: React.MouseEvent<HTMLElement>, newNPoems: number) => {
        if (!lineLength || !newNPoems || !nRounds) {
            return;
        }
        setNPoems(newNPoems);
        emitAlterGameSettings({ lineLength, nPoems: newNPoems, nRounds });
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
                    <span style={settingLabel}>Line Length</span>
                    <ToggleButtonGroup
                        value={lineLength}
                        exclusive
                        onChange={handleLineLength}
                        disabled={!settingsEnabled}
                        sx={{ width: 200, "& .MuiToggleButton-root": { flex: 1 } }}
                    >
                        <ToggleButton value={LineLength.SHORT}>Short</ToggleButton>
                        <ToggleButton value={LineLength.LONG}>Long</ToggleButton>
                    </ToggleButtonGroup>
                </div>

                <div style={settingRow}>
                    <span style={settingLabel}>Rounds</span>
                    <ToggleButtonGroup
                        value={nRounds}
                        exclusive
                        onChange={handleNRounds}
                        disabled={!settingsEnabled}
                        sx={{ width: 200, "& .MuiToggleButton-root": { flex: 1 } }}
                    >
                        <ToggleButton value={2}>2</ToggleButton>
                        <ToggleButton value={3}>3</ToggleButton>
                        <ToggleButton value={4}>4</ToggleButton>
                    </ToggleButtonGroup>
                </div>

                <div style={settingRow}>
                    <span style={settingLabel}>Poems</span>
                    <ToggleButtonGroup
                        value={nPoems}
                        exclusive
                        onChange={handleNPoems}
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

export default PoemGameSettings;
