import {
    emitRequestBotEnabled,
    emitRequestGameSettingsInfo,
    emitRequestSettingsEnabled,
} from "context/SocketRequestors";
import { useState } from "react";

export function useInitializeGameSettings() {
    const [rendered, setRendered] = useState(false);
    if (!rendered) {
        emitRequestSettingsEnabled();
        emitRequestBotEnabled();
        emitRequestGameSettingsInfo();
        setRendered(true);
    }
}
