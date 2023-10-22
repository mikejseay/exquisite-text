import * as React from "react";
import { socket } from "../../context/SocketActions";
import LogoutIcon from "@mui/icons-material/Logout";
import Fab from "@mui/material/Fab";
import WarningIcon from "@mui/icons-material/Warning";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { ClickAwayListener } from "@mui/material";
import { leaveConfirmBox, leaveFAB } from "./styles";

function LeaveButton() {

    const handleLeave = () => {
        socket.emit("leave");
    };
    const [ open, setOpen ] = React.useState(false);
    const handleClick = () => {
        setOpen((prev) => !prev);
    };
    const handleClickAway = () => {
        setOpen(false);
    };


    return (
        <React.Fragment>
            <ClickAwayListener onClickAway={handleClickAway}>
                <Box>
                    <Fab
                        aria-label="logout"
                        color="secondary"
                        onClick={handleClick}
                        size="small"
                        sx={leaveFAB}
                    >
                        <LogoutIcon />
                    </Fab>
                    {open
                        ? (
                            <Box sx={leaveConfirmBox}>
                                <p style={{ margin: "0 0 0.5em 0" }}><WarningIcon />
                                    Want to leave the room?</p>
                                <Stack spacing={2} direction="row"
                                    style={{ justifyContent: "center" }}>
                                    <Button variant="outlined" onClick={handleClickAway}>No</Button>
                                    <Button variant="contained" onClick={handleLeave}>Yes</Button>
                                </Stack>
                            </Box>
                        )
                        : null}
                </Box>
            </ClickAwayListener>
        </React.Fragment>
    );
}

export default LeaveButton;
