import Alert from "@mui/material/Alert";
import { useRoomCodeNotification } from "context/RoomCodeNotificationContext";
import * as React from "react";

export function RoomCodeBanner() {
    const { notification, copied } = useRoomCodeNotification();

    if (!notification) return null;

    return (
        <>
            <Alert severity="warning">
                Enter room code: <b>{notification.roomID}</b>
            </Alert>
            {copied && (
                <Alert severity="success">
                    Copied to clipboard: <b>{notification.shareLink}</b>
                </Alert>
            )}
        </>
    );
}
