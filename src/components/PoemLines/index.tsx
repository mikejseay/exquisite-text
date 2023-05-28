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
import { ILine } from "../../types";

import { lineSepString, shortDur } from "../../constants";

function PoemLines({ poemLines, editorColors }: { poemLines: ILine[], editorColors: Record<string, string> }) {
    const clipboard = useClipboard({
        copiedTimeout: shortDur, // timeout duration in milliseconds
    });

    return (
        <div style={poemsBody}>
            {poemLines.map((line) => {
                return <div key={line.lineIndex} style={{ whiteSpace: "pre-line" }}>
                    <span className={"first-part"} style={{ color: editorColors[line.passerDevice] }}>
                        {line.content.slice(0, line.editLength)}
                    </span>
                    <span className={"second-part"} style={{ color: editorColors[line.authorDevice] }}>
                        {line.content.slice(line.editLength)}
                    </span>
                </div>;
            })}
            <IconButton onClick={() => clipboard.copy(poemLines.map(line => line.content).join(lineSepString))}>
                <ContentCopyIcon />
            </IconButton>
            {clipboard.copied && <Alert severity="success" style={{ position: "fixed" }}>
                Copied!
            </Alert>}
            <Card>
                <CardContent style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
                    {Object.entries(editorColors).map(([ editor, color ], index) => (
                        <Box key={index} style={{ margin: "0.5rem", display: "flex", alignItems: "center" }}>
                            <FiberManualRecordIcon style={{ color }} />
                            <Typography style={{ marginLeft: "0.5rem" }}>{editor}</Typography>
                        </Box>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

export default PoemLines;
