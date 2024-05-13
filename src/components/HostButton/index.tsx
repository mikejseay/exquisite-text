import * as React from "react";
import { useNavigate } from "react-router-dom";
import GamepadIcon from "@mui/icons-material/Gamepad";
import Fab from "@mui/material/Fab";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { useClipboard } from "use-clipboard-copy";

import { hostFAB, roomCodeStyles } from "./styles";
import { generateAlphaString } from "../../helpers";
import { roomCodeLength } from "../../constants";
import { emitCreateGameHost } from "../../context/SocketRequestors";

function HostButton() {
    const [ open, setOpen ] = React.useState(false);
    const [ roomID, setRoomID ] = React.useState<string | null>(null);
    const [ shareLink, setShareLink ] = React.useState<string | null>(null);
    const navigate = useNavigate();

    const clipboard = useClipboard({
        copiedTimeout: 6_000, // timeout duration in milliseconds
    });

    const handleClick = () => {
        setOpen((prev) => !prev);
        if (!open) {
            const roomID = generateAlphaString(roomCodeLength);
            const shareLink = `${location.protocol}//${location.host}/${roomID}`;
            setRoomID(roomID);
            setShareLink(shareLink);
            clipboard.copy(shareLink);
            emitCreateGameHost(roomID);
            navigate(`/${roomID}`);
        }
    };

    const alerts = open && (
        <div style={roomCodeStyles}>
            <Alert severity="warning">
                Enter room code: <b>{roomID}</b>
            </Alert>
            {clipboard.copied && <Alert severity="success">
                Copied to clipboard: <b>{shareLink}</b>
            </Alert>}
        </div>
    );

    return (
        <div className={"create-game-fab"}>
            <Box>
                <Fab
                    aria-label="new"
                    color="primary"
                    onClick={handleClick}
                    size="small"
                    sx={hostFAB}
                >
                    <GamepadIcon />
                </Fab>
                {alerts}
            </Box>
        </div>
    );
}

export default HostButton;
