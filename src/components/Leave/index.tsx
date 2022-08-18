import * as React from "react";
import { useSocket } from "../App";
import {
    accordionDiv,
} from "../LineInput/styles";
import LogoutIcon from "@mui/icons-material/Logout";
import Fab from "@mui/material/Fab";
import WarningIcon from "@mui/icons-material/Warning";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { ClickAwayListener } from "@mui/material";
import { SxProps } from "@mui/system";

function Leave() {
    const { socket } = useSocket();

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
    const styles: SxProps = {
        position: "absolute",
        top: 60,
        right: 20,
        zIndex: 1,
        border: "1px solid",
        p: 1,
        bgcolor: "background.paper",
        width: 170,
        marginRight: 0,
        marginLeft: "auto",
        fontFamily: "sans-serif",
    };

    return (
        <div className={"leave-game-accordion"} style={accordionDiv}>
            <ClickAwayListener onClickAway={handleClickAway}>
                <Box>
                    <Fab
                        size="small"
                        color="secondary"
                        aria-label="logout"
                        sx={{position: "absolute", right: "15px", top: "10px"}}
                        onClick={handleClick}
                    >
                        <LogoutIcon />
                    </Fab>
                    {open
                        ? (
                            <Box sx={styles}>
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
        </div>
    );
}

export default Leave;
