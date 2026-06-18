import Button from "@mui/material/Button";
import { useSocketInfo } from "context/SocketInfoProvider";
import { emitAddDrawingBot, emitAddPoemBot } from "context/SocketRequestors";
import { textCentered } from "styles/common";
import { Medium } from "types/types";
import { logger } from "utilities/loggerUtils";

const SECRET_NAME = "SANANBYEKIM";

function UserTable() {
    const { userInfo, settingsEnabled, medium } = useSocketInfo();
    logger.debug(`userInfo ${userInfo}`);
    if (!userInfo) {
        return null;
    }
    const { editors, editorColors, spectators, hostIndex } = userInfo;
    logger.debug(`editors ${editors}`);
    logger.debug(`editorColors ${editorColors}`);
    logger.debug(`spectators ${spectators}`);
    if (!editors) {
        return null;
    }
    if (!spectators) {
        return null;
    }

    const isHostSecret = editors.length > 0 && editors[0] === SECRET_NAME;
    const showAddBot = isHostSecret && (medium === Medium.POETRY || medium === Medium.DRAWING);
    const addBot = medium === Medium.DRAWING ? emitAddDrawingBot : emitAddPoemBot;

    return (
        <div className={"userTable"} style={textCentered}>
            <div
                className={"editors"}
                style={{
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 12,
                    padding: "1rem 1.5rem",
                    marginBottom: "0.5rem",
                }}
            >
                <h2 style={{ marginTop: 0 }}>Editors</h2>
                {editors.map((name, nameIndex) => {
                    return (
                        <p key={nameIndex} style={{ color: editorColors[nameIndex], fontSize: "1.2rem" }}>
                            {name}
                            {nameIndex === hostIndex && " (HOST)"}
                        </p>
                    );
                })}
                {showAddBot && (
                    <Button
                        disabled={!settingsEnabled || editors.length >= 4}
                        onClick={() => addBot()}
                        variant="contained"
                        sx={{ mt: 1 }}
                    >
                        Add Bot
                    </Button>
                )}
            </div>
            {spectators.length > 0 && (
                <div className={"spectators"} style={{ marginTop: "1rem" }}>
                    <h2 style={{ marginTop: 0 }}>Spectators</h2>
                    {spectators.map((name, nameIndex) => {
                        return <p key={nameIndex}>{name}</p>;
                    })}
                </div>
            )}
        </div>
    );
}

export default UserTable;
