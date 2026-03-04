import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import * as React from "react";
import { useLocation } from "react-router-dom";

const DISMISSED_KEY = "landscapeBannerDismissed";
const END_ROUTES = [ "/end", "/endtestpoem", "/endtestdrawing" ];

export function LandscapeBanner() {
    const [ visible, setVisible ] = React.useState(false);
    const location = useLocation();

    if (END_ROUTES.includes(location.pathname)) return null;

    React.useEffect(() => {
        if (localStorage.getItem(DISMISSED_KEY)) return;

        const mql = window.matchMedia("(orientation: portrait) and (pointer: coarse)");
        const onChange = (e: MediaQueryListEvent | MediaQueryList) =>
            setVisible(e.matches);

        onChange(mql);
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    if (!visible) return null;

    const handleDismiss = () => {
        localStorage.setItem(DISMISSED_KEY, "true");
        setVisible(false);
    };

    return (
        <Alert
            action={
                <IconButton
                    aria-label="dismiss landscape suggestion"
                    color="inherit"
                    onClick={handleDismiss}
                    size="small"
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            }
            role="status"
            severity="info"
            sx={{
                justifyContent: "center",
                position: "absolute",
                top: "3rem",
                left: "50%",
                transform: "translateX(-50%)",
                width: "fit-content",
                zIndex: 10,
                fontSize: "clamp(0.7rem, 3vw, 0.875rem)",
            }}
        >
            For the best experience, rotate your device to landscape.
        </Alert>
    );
}
