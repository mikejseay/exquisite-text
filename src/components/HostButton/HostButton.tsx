import * as React from "react";
import { useNavigate } from "react-router-dom";
import ArticleIcon from "@mui/icons-material/Article";
import BrushIcon from "@mui/icons-material/Brush";
import Fab from "@mui/material/Fab";
import Alert from "@mui/material/Alert";
import { useClipboard } from "use-clipboard-copy";

import { hostButtonLabel, hostButtonWrapper, hostButtonsContainer, roomCodeStyles } from "components/HostButton/styles";
import { generateAlphaString } from "helpers/helpers";
import { roomCodeLength } from "constants/constants";
import { emitCreateRoomAndHost } from "context/SocketRequestors";
import { Medium } from "types/types";

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
            emitCreateRoomAndHost(roomID, medium);
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

    const buttons: { medium: Medium; label: string; ariaLabel: string; color: "primary" | "secondary"; icon: React.ReactNode }[] = [
        { medium: Medium.POETRY, label: "Host\nPoetry", ariaLabel: "create poem", color: "primary", icon: <ArticleIcon /> },
        { medium: Medium.DRAWING, label: "Host\nDrawing", ariaLabel: "create drawing", color: "secondary", icon: <BrushIcon /> },
    ];

    return (
        <div style={hostButtonsContainer}>
            {buttons.map(({ medium, label, ariaLabel, color, icon }) => (
                <div key={medium} style={hostButtonWrapper}>
                    <Fab
                        aria-label={ariaLabel}
                        color={color}
                        onClick={() => handleClick(medium)}
                        size="small"
                    >
                        {icon}
                    </Fab>
                    <span style={hostButtonLabel}>{label}</span>
                </div>
            ))}
            {alerts}
        </div>
    );
}

export default HostButton;
