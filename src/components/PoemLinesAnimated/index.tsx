import * as React from "react";
import Alert from "@mui/material/Alert";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import IconButton from "@mui/material/IconButton";
import { useClipboard } from "use-clipboard-copy";


import { poemBody } from "./styles";
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

function PoemLinesAnimated({
    poemLines,
    userInfo,
    width,
    reRender,
    setReRender,
}: {
    poemLines: ILine[],
    userInfo: IUserTableInfo,
    width: number,
    reRender: boolean,
    setReRender: (value: boolean | ((prevVar: boolean) => boolean)) => void;
}) {
    const {
        editorColorArr,
        editors,
    } = userInfo;
    const clipboard = useClipboard({
        copiedTimeout: shortDur, // timeout duration in milliseconds
    });

    return (
        <div className={"poem-body"} style={poemBody}>
            <div className={"copy-button"} style={{
                display: "flex",
                marginTop: "-2em",
            }}>
                <IconButton
                    onClick={() => clipboard.copy(poemLines.map(line => line.content).join(lineSepString))}
                >
                    <ContentCopyIcon />
                </IconButton>
                {clipboard.copied && <Alert severity="success" style={{ marginBottom: "-1em" }}>
                    Copied!
                </Alert>}
            </div>
            <TypewriterPoem
                poemLines={poemLines}
                userInfo={userInfo}
                reRender={reRender}
                setReRender={setReRender}
                width={width}
                speed={40}
                random={20}
                delay={70}
            />
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
