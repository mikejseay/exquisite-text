import * as React from "react";
import { useState } from "react";
import PoemGameSettings from "../../components/PoemGameSettings";
import DrawingGameSettings from "../../components/DrawingGameSettings";
import LeaveButton from "../../components/LeaveButton";
import UserTable from "../../components/UserTable";
import RoomCode from "../../components/RoomCode";
import { Medium } from "../../types";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useSocketInfo } from "../../context/SocketInfoProvider";
import { emitStartGame } from "../../context/SocketRequestors";

function Lobby() {
    const { medium, settingsEnabled } = useSocketInfo();
    const isLandscape = useMediaQuery("(min-aspect-ratio: 1/1)");
    const [ activeTab, setActiveTab ] = useState(0);

    const gameSettings = medium === Medium.POETRY
        ? <PoemGameSettings hideStartButton={!isLandscape} />
        : <DrawingGameSettings hideStartButton={!isLandscape} />;

    if (isLandscape) {
        return (
            <Box sx={{
                display: "flex",
                flexDirection: "row",
                flex: 1,
                textAlign: "center",
                borderTop: "1px solid rgba(255,255,255,0.12)",
            }}>
                <Box sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRight: "1px solid rgba(255,255,255,0.12)",
                    p: 2,
                    overflow: "auto",
                }}>
                    <UserTable />
                </Box>
                <Box sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 2,
                    overflow: "auto",
                }}>
                    <RoomCode prominent />
                    {gameSettings}
                </Box>
                <LeaveButton />
            </Box>
        );
    }

    return (
        <Box sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            textAlign: "center",
        }}>
            <Box sx={{ pt: 2, px: 2 }}>
                <RoomCode prominent />
            </Box>
            <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                centered
                sx={{ minHeight: 36 }}
            >
                <Tab label="Players" />
                <Tab label="Settings" />
            </Tabs>
            <Box sx={{
                flex: 1,
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                p: 2,
            }}>
                {activeTab === 0
                    ? <UserTable />
                    : gameSettings}
            </Box>
            <Box sx={{ p: 2 }}>
                <Button
                    disabled={!settingsEnabled}
                    onClick={() => emitStartGame()}
                    variant="contained"
                    fullWidth
                    size="large"
                >
                    Start Game
                </Button>
            </Box>
            <LeaveButton />
        </Box>
    );
}

export default Lobby;
