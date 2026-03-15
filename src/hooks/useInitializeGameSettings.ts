import { useState } from "react";
import { emitRequestGameSettingsInfo, emitRequestSettingsEnabled } from "../context/SocketRequestors";

export function useInitializeGameSettings() {
    const [ rendered, setRendered ] = useState(false);
    if (!rendered) {
        emitRequestSettingsEnabled();
        emitRequestGameSettingsInfo();
        setRendered(true);
    }
}
