import * as React from "react";
import { useState } from "react";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ArticleIcon from "@mui/icons-material/Article";
import BrushIcon from "@mui/icons-material/Brush";
import PoemGameSettings from "../../components/PoemGameSettings";
import DrawingGameSettings from "../../components/DrawingGameSettings";
import LeaveButton from "../../components/LeaveButton";
import UserTable from "../../components/UserTable";
import RoomCode from "../../components/RoomCode";
import { Medium } from "../../types";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

function Lobby() {
    const [ medium, setMedium ] = useState<Medium>(Medium.POETRY);

    const handleMediumChange = (
        event: React.MouseEvent<HTMLElement>,
        newMedium: Medium | null,
    ) => {
        if (newMedium !== null) {
            setMedium(newMedium);
        }
    };

    return (
        <Box 
            sx={{ 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "center", 
                height: "100vh", 
                textAlign: "center", 
            }}
        >
            <RoomCode />
            <UserTable />
            {/* TODO: Room was created with drawingroom/poemroom, fix so we can switch after creation */}
            {/* <Box sx={{ margin: 2 }}>
                <h2>Medium:</h2>
                <ToggleButtonGroup
                    value={medium}
                    exclusive
                    onChange={handleMediumChange}
                    aria-label="medium selector"
                    sx={{ justifyContent: "center" }}
                >
                    <ToggleButton value={Medium.POETRY} aria-label="poetry">
                        <ArticleIcon fontSize="large" />
                        <Typography variant="body1" sx={{ marginLeft: 1 }}>
                            Poetry
                        </Typography>
                    </ToggleButton>
                    <ToggleButton value={Medium.DRAWING} aria-label="drawing">
                        <BrushIcon fontSize="large" />
                        <Typography variant="body1" sx={{ marginLeft: 1 }}>
                            Drawing
                        </Typography>
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box> */}
            {medium === Medium.POETRY
                ? (
                    <PoemGameSettings />
                )
                : (
                    <DrawingGameSettings />
                )}
            <LeaveButton />
        </Box>
    );
}

export default Lobby;
