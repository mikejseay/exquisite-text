import * as React from "react";
import Button from "@mui/material/Button";
import { useSocketInfo } from "../../context/SocketInfoProvider";
import { emitAddPoemBot } from "../../context/SocketRequestors";
import { Medium } from "../../types";
import { textCentered } from "../../styles/common";
import { logger } from "../../utilities/loggerUtils";

const SECRET_NAME = "SANANBYEKIM";

function UserTable() {
    const { userInfo, settingsEnabled, medium } = useSocketInfo();
    logger.debug(`userInfo ${userInfo}`);
    if (!userInfo) {
        return null;
    }
    const { editors, editorColors, spectators } = userInfo;
    logger.debug(`editors ${editors}`);
    logger.debug(`editorColors ${editorColors}`);
    logger.debug(`spectators ${spectators}`);
    if (!editors) {
        return null;
    }
    if (!spectators) {
        return null;
    }

    const showAddBot = medium === Medium.POETRY
        && editors.length > 0
        && editors[0] === SECRET_NAME;

    return (
        <div className={"userTable"} style={textCentered}>
            <div className={"editors"}>
                <h2>Editors:</h2>
                {editors.map((name, nameIndex) => {
                    return (
                        <p key={nameIndex} style={{ color: editorColors[nameIndex] }}>{name}</p>
                    );
                })}
                {showAddBot && (
                    <Button
                        disabled={!settingsEnabled || editors.length >= 4}
                        onClick={() => emitAddPoemBot()}
                        variant="contained"
                        sx={{ mt: 1 }}
                    >
                        Add Bot
                    </Button>
                )}
            </div>
            {spectators.length > 0 && (
                <div className={"spectators"}>
                    <h2>Spectators:</h2>
                    {spectators.map((name, nameIndex) => {
                        return (
                            <p key={nameIndex}>{name}</p>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default UserTable;
