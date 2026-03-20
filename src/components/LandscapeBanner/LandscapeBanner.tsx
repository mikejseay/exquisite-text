import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import * as React from "react";
import { useLocation } from "react-router-dom";

const DISMISSED_KEY = "landscapeBannerDismissed";
const END_ROUTES = [ "/end", "/endtestpoem", "/endtestdrawing" ];

export function LandscapeBanner() {
    const [ isPortrait, setIsPortrait ] = React.useState(false);
    const [ dismissed, setDismissed ] = React.useState(
        () => sessionStorage.getItem(DISMISSED_KEY) === "true",
    );
    const location = useLocation();

    React.useEffect(() => {
        const mql = window.matchMedia("(orientation: portrait) and (pointer: coarse)");
        const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
            setIsPortrait(e.matches);
            if (e.matches) {
                setDismissed(sessionStorage.getItem(DISMISSED_KEY) === "true");
            }
        };

        onChange(mql);
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    if (!isPortrait || dismissed || END_ROUTES.includes(location.pathname)) return null;

    const handleDismiss = () => {
        sessionStorage.setItem(DISMISSED_KEY, "true");
        setDismissed(true);
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
