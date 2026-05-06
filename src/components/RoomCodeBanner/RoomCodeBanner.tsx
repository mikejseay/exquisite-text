import Alert from "@mui/material/Alert";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useRoomCodeNotification } from "context/RoomCodeNotificationContext";
import * as React from "react";

export function RoomCodeBanner() {
    const { notification, copied } = useRoomCodeNotification();
    const isNarrow = useMediaQuery("(max-width: 767px)");

    if (!notification) return null;

    return (
        <>
            <Alert severity="success">
                Room created! <br></br>
                Code: <b>{notification.roomID}</b>
            </Alert>
            {!isNarrow && copied && (
                <Alert severity="success">
                    Copied to clipboard: <b>{notification.shareLink}</b>
                </Alert>
            )}
        </>
    );
}
