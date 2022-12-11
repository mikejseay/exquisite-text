import * as React from "react";
import GamepadIcon from "@mui/icons-material/Gamepad";
import Fab from "@mui/material/Fab";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { ClickAwayListener } from "@mui/material";
import { hostFAB, roomCodeStyles } from "./styles";

import { generateAlphaString } from "../../helpers";
import { roomCodeLength } from "../../constants";
import { Socket } from "socket.io-client";

function HostButton({ socket }: { socket: Socket | null }) {
    const [ open, setOpen ] = React.useState(false);
    const [ roomID, setRoomID ] = React.useState<string | null>(null);

    const handleClick = () => {
        setOpen((prev) => !prev);
    };
    const handleClickAway = () => {
        // disabled
        // setOpen(false);
    };
    React.useEffect(() => {
        if (!open && socket) {
            const roomID = generateAlphaString(roomCodeLength);
            setRoomID(roomID);
            socket.emit("createGameHost", roomID);
        }
    }, [ open ]);

    return (
        <div className={"create-game-fab"}>
            <ClickAwayListener onClickAway={handleClickAway}>
                <Box>
                    <Fab
                        size="small"
                        color="primary"
                        aria-label="new"
                        sx={hostFAB}
                        onClick={handleClick}
                    >
                        <GamepadIcon />
                    </Fab>
                    {open
                        ? (
                            <Alert severity="warning" style={roomCodeStyles}>
                                Enter room code: <b>{roomID}</b>
                            </Alert>
                        )
                        : null}
                </Box>
            </ClickAwayListener>
        </div>
    );
}

export default HostButton;
