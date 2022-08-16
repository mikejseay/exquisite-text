import * as React from "react";
import GamepadIcon from "@mui/icons-material/Gamepad";
import Fab from "@mui/material/Fab";
import WarningIcon from "@mui/icons-material/Warning";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { ClickAwayListener } from "@mui/material";
import { SxProps } from "@mui/system";
import { Link as RouterLink } from "react-router-dom";

function CreateGame() {
    const [ open, setOpen ] = React.useState(false);
    const handleClick = () => {
        setOpen((prev) => !prev);
    };
    const handleClickAway = () => {
        setOpen(false);
    };
    const styles: SxProps = {
        position: "absolute",
        top: 80,
        left: "calc(50vw - 40ch - 10px)",
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
        <div className={"create-game-fab"}>
            <ClickAwayListener onClickAway={handleClickAway}>
                <Box>
                    <Fab
                        size="small"
                        color="primary"
                        aria-label="new"
                        sx={{position: "absolute", left: "calc(50vw - 40ch - 20px)", top: "20px"}}
                        onClick={handleClick}
                    >
                        <GamepadIcon />
                    </Fab>
                    {open
                        ? (
                            <Box sx={styles}>
                                <p style={{ margin: "0 0 0.5em 0" }}><WarningIcon />
                                    Host new game?</p>
                                <Stack spacing={2} direction="row"
                                    style={{ justifyContent: "center" }}>
                                    <Button variant="outlined" onClick={handleClickAway}>No</Button>
                                    <Button
                                        variant="contained"
                                        component={RouterLink}
                                        to="host"
                                        onClick={handleClickAway}
                                    >
                                        Yes
                                    </Button>
                                </Stack>
                            </Box>
                        )
                        : null}
                </Box>
            </ClickAwayListener>
        </div>
    );
}

export default CreateGame;
