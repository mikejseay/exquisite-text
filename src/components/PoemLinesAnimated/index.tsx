import * as React from "react";
import Alert from "@mui/material/Alert";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import IconButton from "@mui/material/IconButton";
import { useClipboard } from "use-clipboard-copy";


import { poemsBody } from "./styles";
import {
    ILine,
    IUserTableInfo,
} from "../../types";

import { lineSepString, shortDur } from "../../constants";
import TypewriterPoem from "../TypewriterPoem";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";

function PoemLinesAnimated(
    { poemLines, userInfo, width }:
        { poemLines: ILine[], userInfo: IUserTableInfo, width: number }) {
    const {
        editorColorArr,
        editors,
    } = userInfo;
    const clipboard = useClipboard({
        copiedTimeout: shortDur, // timeout duration in milliseconds
    });

    return (
        <div className={"poems-body"} style={poemsBody}>
            <TypewriterPoem
                poemLines={poemLines}
                userInfo={userInfo}
                width={width}
                speed={30}
                random={30}
                delay={30}
            />
            <div className={"copy-button"} style={{
                display: "flex",
                flexDirection: "row",
            }}>
                <IconButton
                    onClick={() => clipboard.copy(poemLines.map(line => line.content).join(lineSepString))}
                    style={{
                        marginLeft: "auto",
                        marginRight: "4ch",
                    }}
                >
                    <ContentCopyIcon />
                </IconButton>
            </div>
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

export default PoemLinesAnimated;
