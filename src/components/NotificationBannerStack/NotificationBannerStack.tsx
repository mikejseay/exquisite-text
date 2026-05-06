import Box from "@mui/material/Box";
import * as React from "react";

const NOTIFICATION_STACK_ID = "notification-banner-stack";

export function NotificationBannerStack() {
    return (
        <Box
            id={NOTIFICATION_STACK_ID}
            sx={{
                alignItems: "stretch",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                left: "50%",
                position: "absolute",
                top: "3rem",
                transform: "translateX(-50%)",
                width: "min(70vw, 12rem)",
                zIndex: 10,
                "& .MuiAlert-root": {
                    borderRadius: 1,
                },
            }}
        />
    );
}

export function useNotificationStackTarget(): HTMLElement | null {
    const [target, setTarget] = React.useState<HTMLElement | null>(null);
    React.useEffect(() => {
        setTarget(document.getElementById(NOTIFICATION_STACK_ID));
    }, []);
    return target;
}
