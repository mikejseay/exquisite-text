import * as React from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import Button from "@mui/material/Button";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import Typography from "@mui/material/Typography";
import AccordionDetails from "@mui/material/AccordionDetails";

import { useSocket } from "../App";
import {
    accordionButton,
    accordionText,
    accordionTitle,
} from "../LineInput/styles";

function Leave() {
    const { socket } = useSocket();

    const handleLeaveButton = () => {
        socket.emit("leave");
    };

    return (
        <div className={"leave-game-accordion"} style={{ marginTop: "1em" }}>
            <Accordion>
                <AccordionSummary
                    aria-controls="panel1a-content"
                    expandIcon={<ExpandMoreIcon />}
                    id="panel1a-header"
                >
                    <div
                        className={"leave-game-accordion-title"}
                        style={accordionTitle}
                    >
                        <Typography>
                            <strong>Need to leave the game early?</strong>
                        </Typography>
                    </div>
                </AccordionSummary>
                <AccordionDetails>
                    <div
                        className={"leave-game-accordion-text"}
                        style={accordionText}
                    >
                        Only press this button if you are absolutely certain you want to leave!
                    </div>
                    <div
                        className={"leave-game-button"}
                        style={accordionButton}
                    >
                        <Button
                            onClick={handleLeaveButton}
                            variant="contained"
                        >
                            Leave Game
                        </Button>
                    </div>
                </AccordionDetails>
            </Accordion>
        </div>
    );
}

export default Leave;
