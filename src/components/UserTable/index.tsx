import * as React from "react";
import { useSocketInfo } from "../../context/SocketInfoProvider";
import { logger } from "../../utils/loggerUtils";

function UserTable() {
    const { userInfo } = useSocketInfo();
    logger.debug("userInfo", userInfo);
    if (!userInfo) {
        return null;
    }
    const { editors, editorColors, spectators } = userInfo;
    logger.debug("editors", editors);
    logger.debug("editorColors", editorColors);
    logger.debug("spectators", spectators);
    if (!editors) {
        return null;
    }
    if (!spectators) {
        return null;
    }

    // const { editors, editorColors, spectators } = userInfo;
    // logger.debug({ userInfo });

    return (
        <div className={"userTable"} style={{ textAlign: "center" }}>
            <div className={"editors"}>
                <h2>Editors:</h2>
                {editors.map((name, nameIndex) => {
                    return (
                        <p key={nameIndex} style={{ color: editorColors[nameIndex] }}>{name}</p>
                    );
                })}
            </div>
            <div className={"spectators"}>
                <h2>Spectators:</h2>
                {spectators.map((name, nameIndex) => {
                    return (
                        <p key={nameIndex}>{name}</p>
                    );
                })}
            </div>
        </div>
    );
}

export default UserTable;
