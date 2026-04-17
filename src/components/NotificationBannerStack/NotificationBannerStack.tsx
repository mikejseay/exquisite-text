import type * as React from "react";

export function NotificationBannerStack({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                left: "50%",
                maxWidth: "90vw",
                position: "absolute",
                top: "3rem",
                transform: "translateX(-50%)",
                zIndex: 10,
            }}
        >
            {children}
        </div>
    );
}
