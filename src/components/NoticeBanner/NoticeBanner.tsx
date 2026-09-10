import Alert from "@mui/material/Alert";
import { useNotificationStackTarget } from "components/NotificationBannerStack/NotificationBannerStack";
import { useSocketInfo } from "context/SocketInfoProvider";
import { createPortal } from "react-dom";

// Shows a server announcement for the room (stcNotice) in the banner stack
export function NoticeBanner() {
    const { notice } = useSocketInfo();
    const stackTarget = useNotificationStackTarget();
    if (!notice || !stackTarget) return null;
    return createPortal(<Alert severity="info">{notice}</Alert>, stackTarget);
}
