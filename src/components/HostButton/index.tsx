import * as React from "react";
import { useNavigate } from "react-router-dom";
import ArticleIcon from "@mui/icons-material/Article";
import BrushIcon from "@mui/icons-material/Brush";
import Fab from "@mui/material/Fab";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { useClipboard } from "use-clipboard-copy";

import { hostFAB, roomCodeStyles } from "./styles";
import { generateAlphaString } from "../../helpers";
import { roomCodeLength } from "../../constants";
import { emitCreateGameHost } from "../../context/SocketRequestors";
import { Medium } from "../../types";

function HostButton() {
    const [ open, setOpen ] = React.useState(false);
    const [ roomID, setRoomID ] = React.useState<string | null>(null);
    const [ shareLink, setShareLink ] = React.useState<string | null>(null);
    const navigate = useNavigate();

    const clipboard = useClipboard({
        copiedTimeout: 6_000, // timeout duration in milliseconds
    });

    const handleClick = (medium: Medium) => {
        setOpen((prev) => !prev);
        if (!open) {
            const roomID = generateAlphaString(roomCodeLength);
            const shareLink = `${location.protocol}//${location.host}/${roomID}`;
            setRoomID(roomID);
            setShareLink(shareLink);
            clipboard.copy(shareLink);
            emitCreateGameHost(medium, roomID);
            navigate(`/${roomID}`);
        }
    };

    const alerts = open && (
        <div style={roomCodeStyles}>
            <Alert severity="warning">
                Enter room code: <b>{roomID}</b>
            </Alert>
            {clipboard.copied && (
                <Alert severity="success">
                    Copied to clipboard: <b>{shareLink}</b>
                </Alert>
            )}
        </div>
    );

    return (
        <div className={"create-game-fab"}>
            <Box>
                <Fab
                    aria-label="create poem"
                    color="primary"
                    onClick={() => {
                        handleClick(Medium.POETRY);
                    }}
                    size="small"
                    sx={hostFAB}
                >
                    <ArticleIcon />
                </Fab>
                <Fab
                    aria-label="create drawing"
                    color="secondary"
                    onClick={() => {
                        handleClick(Medium.DRAWING);
                    }}
                    size="small"
                    sx={{ ...hostFAB, marginLeft: 6 }}
                >
                    <BrushIcon />
                </Fab>
                {alerts}
            </Box>
        </div>
    );
}

export default HostButton;
