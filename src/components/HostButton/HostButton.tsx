import ArticleIcon from "@mui/icons-material/Article";
import BrushIcon from "@mui/icons-material/Brush";
import Alert from "@mui/material/Alert";
import Fab from "@mui/material/Fab";
import useMediaQuery from "@mui/material/useMediaQuery";
import { hostButtonLabel, hostButtonsContainer, hostButtonWrapper } from "components/HostButton/styles";
import { useNotificationStackTarget } from "components/NotificationBannerStack/NotificationBannerStack";
import { NARROW_VIEWPORT_QUERY, roomCodeLength } from "constants/constants";
import { emitCreateRoomAndHost } from "context/SocketRequestors";
import { generateAlphaString } from "helpers/helpers";
import * as React from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Medium } from "types/types";
import { useClipboard } from "use-clipboard-copy";

function HostButton() {
    const [roomID, setRoomID] = React.useState<string | null>(null);
    const [shareLink, setShareLink] = React.useState<string | null>(null);
    const navigate = useNavigate();
    const isNarrow = useMediaQuery(NARROW_VIEWPORT_QUERY);
    const stackTarget = useNotificationStackTarget();
    const clipboard = useClipboard({ copiedTimeout: 6_000 });

    const handleClick = (medium: Medium) => {
        const newRoomID = generateAlphaString(roomCodeLength);
        const newShareLink = `${location.protocol}//${location.host}/${newRoomID}`;
        setRoomID(newRoomID);
        setShareLink(newShareLink);
        clipboard.copy(newShareLink);
        emitCreateRoomAndHost(newRoomID, medium);
        navigate(`/${newRoomID}`);
    };

    const alerts = roomID && (
        <>
            <Alert severity="success">
                Room created! <br />
                Code: <b>{roomID}</b>
            </Alert>
            {!isNarrow && clipboard.copied && (
                <Alert severity="success">
                    Copied to clipboard: <b>{shareLink}</b>
                </Alert>
            )}
        </>
    );

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
            {stackTarget && alerts && createPortal(alerts, stackTarget)}
        </div>
    );
}

export default HostButton;
