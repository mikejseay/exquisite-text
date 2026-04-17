import * as React from "react";
import { useClipboard } from "use-clipboard-copy";

interface RoomCodeInfo {
    roomID: string;
    shareLink: string;
}

interface RoomCodeNotificationContextValue {
    notification: RoomCodeInfo | null;
    copied: boolean;
    showNotification: (info: RoomCodeInfo) => void;
}

const RoomCodeNotificationContext = React.createContext<RoomCodeNotificationContextValue>({
    notification: null,
    copied: false,
    showNotification: () => {},
});

export function RoomCodeNotificationProvider({ children }: { children: React.ReactNode }) {
    const [notification, setNotification] = React.useState<RoomCodeInfo | null>(null);
    const clipboard = useClipboard({ copiedTimeout: 6_000 });

    const showNotification = React.useCallback(
        (info: RoomCodeInfo) => {
            setNotification(info);
            clipboard.copy(info.shareLink);
        },
        [clipboard],
    );

    return (
        <RoomCodeNotificationContext.Provider value={{ notification, copied: clipboard.copied, showNotification }}>
            {children}
        </RoomCodeNotificationContext.Provider>
    );
}

export function useRoomCodeNotification() {
    return React.useContext(RoomCodeNotificationContext);
}
