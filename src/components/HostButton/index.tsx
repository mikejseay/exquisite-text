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
import { createGameHost } from "../../context/SocketRequestors";

function HostButton() {
    const [ open, setOpen ] = React.useState(false);
    const [ roomId, setRoomId ] = React.useState<string | null>(null);
    const [ shareLink, setShareLink ] = React.useState<string | null>(null);
    const navigate = useNavigate();

    const clipboard = useClipboard({
        copiedTimeout: 6_000, // timeout duration in milliseconds
    });

    const handleClick = () => {
        setOpen((prev) => !prev);
        if (!open) {
            const roomId = generateAlphaString(roomCodeLength);
            const shareLink = `${location.protocol}//${location.host}/${roomId}`;
            setRoomId(roomId);
            setShareLink(shareLink);
            clipboard.copy(shareLink);
            createGameHost(roomId);
            navigate(`/${roomId}`);
        }
    };

    const alerts = open && (
        <div style={roomCodeStyles}>
            <Alert severity="warning">
                Enter room code: <b>{roomId}</b>
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
