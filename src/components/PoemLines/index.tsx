import * as React from "react";
import Alert from "@mui/material/Alert";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import IconButton from "@mui/material/IconButton";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { useClipboard } from "use-clipboard-copy";
import Box from "@mui/material/Box";

import { poemsBody } from "./styles";
import {
    ILine,
    IUserTableInfo,
} from "../../types";

import { lineSepString, shortDur } from "../../constants";

function PoemLines({ poemLines, userInfo, width }: { poemLines: ILine[], userInfo: IUserTableInfo, width: number }) {
    const {
        editorColorObj,
        editorColorArr,
        editors,
    } = userInfo;
    const clipboard = useClipboard({
        copiedTimeout: shortDur, // timeout duration in milliseconds
    });
    const nLines = poemLines.length;

    return (
        <div className={"poems-body"} style={poemsBody}>
            <div style={{
                whiteSpace: "pre-line",
                height: `${nLines + 4}em`,
                width: `${width}px`,
                display: "inline-block",
                textAlign: "left",
                fontFamily: "'Esteban', serif",
                fontSize: "18px",
            }}>
                {poemLines.map((line) => {
                    return <div key={line.lineIndex} style={{ whiteSpace: "pre-line" }}>
                        <span className={"first-part"} style={{ color: editorColorObj[line.passerDevice] }}>
                            {line.content.slice(0, line.editLength)}
                        </span>
                        <span className={"second-part"} style={{ color: editorColorObj[line.authorDevice] }}>
                            {line.content.slice(line.editLength)}
                        </span>
                    </div>;
                })}
            </div>
            <IconButton onClick={() => clipboard.copy(poemLines.map(line => line.content).join(lineSepString))}>
                <ContentCopyIcon />
            </IconButton>
            {clipboard.copied && <Alert severity="success" style={{ position: "fixed" }}>
                Copied!
            </Alert>}
            <Card>
                <CardContent style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
                    {editors.map((editorName, editorIndex) => {
                        return (
                            <Box key={editorIndex} style={{ margin: "0.5rem", display: "flex", alignItems: "center" }}>
                                <FiberManualRecordIcon style={{ color: editorColorArr[editorIndex] }} />
                                <Typography style={{ marginLeft: "0.5rem" }}>{editorName}</Typography>
                            </Box>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
}

export default PoemLines;
