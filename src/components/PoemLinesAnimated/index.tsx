import * as React from "react";
import Alert from "@mui/material/Alert";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import IconButton from "@mui/material/IconButton";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import { useClipboard } from "use-clipboard-copy";

import { useSocketInfo } from "../../context/SocketInfoProvider";
import { poemBody } from "./styles";
import { ILine } from "../../types";
import { lineSepString, shortDur } from "../../constants";
import TypewriterPoem from "../TypewriterPoem";

function PoemLinesAnimated({
    poemLines,
    width,
    shouldAnimate,
    reRenderIndex,
    setReRender,
    index,
}: {
    poemLines: ILine[],
    width: number,
    shouldAnimate: boolean,
    reRenderIndex: number,
    setReRender: (value: number | ((prevVar: number) => number)) => void;
    index: number,
}) {
    const { userInfo } = useSocketInfo();
    if (!userInfo) {
        return null;
    }
    const { editors, editorColors } = userInfo;

    const clipboard = useClipboard({
        copiedTimeout: shortDur, // timeout duration in milliseconds
    });

    return (
        <div className={"poem-body"} style={poemBody}>
            <div
                className={"copy-button"}
                style={{
                    display: "flex",
                    marginTop: "-2em",
                }}
            >
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
                shouldAnimate={shouldAnimate}
                reRenderIndex={reRenderIndex}
                setReRender={setReRender}
                index={index}
                width={width}
                speed={40}
                random={20}
                delay={200}
            />
            <Card style={{ marginTop: "auto" }}>
                <CardContent sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", padding: "0.4rem 0.5rem", "&:last-child": { paddingBottom: "0.4rem" } }}>
                    {editors.map((editorName, editorIndex) => {
                        return (
                            <Box key={editorIndex} style={{ margin: "0.2rem 0.4rem", display: "flex", alignItems: "center" }}>
                                <FiberManualRecordIcon style={{ color: editorColors[editorIndex], fontSize: "0.75rem" }} />
                                <Typography style={{ marginLeft: "0.3rem", fontSize: "0.8rem" }}>{editorName}</Typography>
                            </Box>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
}

export default PoemLinesAnimated;
