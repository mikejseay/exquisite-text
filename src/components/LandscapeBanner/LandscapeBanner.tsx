import CloseIcon from "@mui/icons-material/Close";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import { useNotificationStackTarget } from "components/NotificationBannerStack/NotificationBannerStack";
import * as React from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";

const DISMISSED_KEY = "landscapeBannerDismissed";
const END_ROUTES = ["/end", "/endtestpoem", "/endtestdrawing"];

export function LandscapeBanner() {
    const [isPortrait, setIsPortrait] = React.useState(false);
    const [dismissed, setDismissed] = React.useState(() => sessionStorage.getItem(DISMISSED_KEY) === "true");
    const location = useLocation();
    const stackTarget = useNotificationStackTarget();

    React.useEffect(() => {
        let recheckTimeout: ReturnType<typeof setTimeout> | undefined;

        const update = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const isTouch = window.matchMedia("(pointer: coarse)").matches;
            const shouldShow = h > w && w <= 767 && isTouch;
            setIsPortrait(shouldShow);
            if (shouldShow) {
                setDismissed(sessionStorage.getItem(DISMISSED_KEY) === "true");
            }
        };

        // iOS WKWebView fires resize/orientationchange BEFORE layout has settled,
        // so we recheck after a short delay to catch the post-rotation dimensions
        const updateWithRecheck = () => {
            update();
            clearTimeout(recheckTimeout);
            recheckTimeout = setTimeout(update, 250);
        };

        update();
        window.addEventListener("resize", updateWithRecheck);
        window.addEventListener("orientationchange", updateWithRecheck);
        return () => {
            clearTimeout(recheckTimeout);
            window.removeEventListener("resize", updateWithRecheck);
            window.removeEventListener("orientationchange", updateWithRecheck);
        };
    }, []);

    if (!isPortrait || dismissed || END_ROUTES.includes(location.pathname) || !stackTarget) return null;

    const handleDismiss = () => {
        sessionStorage.setItem(DISMISSED_KEY, "true");
        setDismissed(true);
    };

    return createPortal(
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
                fontSize: "clamp(0.7rem, 3vw, 0.875rem)",
                "& .MuiAlert-action": {
                    paddingLeft: "4px",
                    marginRight: "-4px",
                },
            }}
        >
            For the best experience, rotate your device to landscape.
        </Alert>,
        stackTarget,
    );
}
