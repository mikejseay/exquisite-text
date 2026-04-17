import ArticleIcon from "@mui/icons-material/Article";
import BrushIcon from "@mui/icons-material/Brush";
import Fab from "@mui/material/Fab";
import { hostButtonLabel, hostButtonsContainer, hostButtonWrapper } from "components/HostButton/styles";
import { roomCodeLength } from "constants/constants";
import { useRoomCodeNotification } from "context/RoomCodeNotificationContext";
import { emitCreateRoomAndHost } from "context/SocketRequestors";
import { generateAlphaString } from "helpers/helpers";
import type * as React from "react";
import { useNavigate } from "react-router-dom";
import { Medium } from "types/types";

function HostButton() {
    const navigate = useNavigate();
    const { showNotification } = useRoomCodeNotification();

    const handleClick = (medium: Medium) => {
        const roomID = generateAlphaString(roomCodeLength);
        const shareLink = `${location.protocol}//${location.host}/${roomID}`;
        showNotification({ roomID, shareLink });
        emitCreateRoomAndHost(roomID, medium);
        navigate(`/${roomID}`);
    };

    const buttons: {
        medium: Medium;
        label: string;
        ariaLabel: string;
        color: "primary" | "secondary";
        icon: React.ReactNode;
    }[] = [
        {
            medium: Medium.POETRY,
            label: "Host\nPoetry",
            ariaLabel: "create poem",
            color: "primary",
            icon: <ArticleIcon />,
        },
        {
            medium: Medium.DRAWING,
            label: "Host\nDrawing",
            ariaLabel: "create drawing",
            color: "secondary",
            icon: <BrushIcon />,
        },
    ];

    return (
        <div style={hostButtonsContainer}>
            {buttons.map(({ medium, label, ariaLabel, color, icon }) => (
                <div key={medium} style={hostButtonWrapper}>
                    <Fab aria-label={ariaLabel} color={color} onClick={() => handleClick(medium)} size="small">
                        {icon}
                    </Fab>
                    <span style={hostButtonLabel}>{label}</span>
                </div>
            ))}
        </div>
    );
}

export default HostButton;
