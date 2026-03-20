import LogoutIcon from "@mui/icons-material/Logout";
import WarningIcon from "@mui/icons-material/Warning";
import { ClickAwayListener } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Fab from "@mui/material/Fab";
import Stack from "@mui/material/Stack";
import { leaveConfirmBox, leaveFAB } from "components/LeaveButton/styles";
import { emitLeave } from "context/SocketRequestors";
import * as React from "react";

function LeaveButton() {
    const [open, setOpen] = React.useState(false);

    const handleClick = () => {
        setOpen((prev) => !prev);
    };

    const handleClickAway = () => {
        setOpen(false);
    };

    return (
        <ClickAwayListener onClickAway={handleClickAway}>
            <Box>
                <Fab aria-label="logout" color="secondary" onClick={handleClick} size="small" sx={leaveFAB}>
                    <LogoutIcon />
                </Fab>
                {open ? (
                    <Box sx={leaveConfirmBox}>
                        <p style={{ margin: "0 0 0.5em 0" }}>
                            <WarningIcon />
                            Want to leave the room?
                        </p>
                        <Stack spacing={2} direction="row" style={{ justifyContent: "center" }}>
                            <Button variant="outlined" onClick={handleClickAway}>
                                No
                            </Button>
                            <Button variant="contained" onClick={emitLeave}>
                                Yes
                            </Button>
                        </Stack>
                    </Box>
                ) : null}
            </Box>
        </ClickAwayListener>
    );
}

export default LeaveButton;
