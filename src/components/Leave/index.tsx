import * as React from "react";
import { useSocket } from "../App";
import {
    accordionDiv,
} from "../LineInput/styles";
import LogoutIcon from "@mui/icons-material/Logout";
import Fab from "@mui/material/Fab";
import Popper from "@mui/material/Popper";
import WarningIcon from "@mui/icons-material/Warning";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

function Leave() {
    const { socket } = useSocket();

    const handleLeave = () => {
        socket.emit("leave");
    };

    const [ anchorEl, setAnchorEl ] = React.useState<null | HTMLElement>(null);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(anchorEl
            ? null
            : event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    const open = Boolean(anchorEl);
    const id = open
        ? "simple-popper"
        : undefined;

    return (
        <div className={"leave-game-accordion"} style={accordionDiv}>
            <Fab
                size="small"
                color="secondary"
                aria-label="logout"
                sx={{position: "absolute", right: "10px", top: "10px"}}
                onClick={handleClick}
            >
                <LogoutIcon />
            </Fab>
            <Popper
                anchorEl={anchorEl}
                id={id}
                open={open}
            >
                <p style={{margin: "1em"}}><WarningIcon />
                    Want to leave the room?</p>
                <Stack spacing={2} direction="row" style={{ justifyContent: "center", marginBottom: "1em" }}>
                    <Button variant="outlined" onClick={handleClose}>No</Button>
                    <Button variant="contained" onClick={handleLeave}>Yes</Button>
                </Stack>
            </Popper>
        </div>
    );
}

export default Leave;
