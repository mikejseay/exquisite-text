import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import {
    colorKeyCard,
    colorKeyContent,
    colorKeyDot,
    colorKeyEntry,
    colorKeyName,
    copyButton,
    poemBody,
} from "components/PoemLinesAnimated/styles";
import TypewriterPoem from "components/TypewriterPoem/TypewriterPoem";
import { lineSepString, shortDur } from "constants/constants";
import { useSocketInfo } from "context/SocketInfoProvider";
import type { ILine } from "types/types";
import { useClipboard } from "use-clipboard-copy";

function PoemLinesAnimated({
    poemLines,
    width,
    shouldAnimate,
    reRenderIndex,
    setReRender,
    index,
}: {
    poemLines: ILine[];
    width: number;
    shouldAnimate: boolean;
    reRenderIndex: number;
    setReRender: (value: number | ((prevVar: number) => number)) => void;
    index: number;
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
            <div className={"copy-button"} style={copyButton}>
                <IconButton onClick={() => clipboard.copy(poemLines.map((line) => line.content).join(lineSepString))}>
                    <ContentCopyIcon />
                </IconButton>
                {clipboard.copied && (
                    <Alert severity="success" style={{ marginBottom: "-1em" }}>
                        Copied!
                    </Alert>
                )}
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
            <Card style={colorKeyCard}>
                <CardContent sx={colorKeyContent}>
                    {editors.map((editorName, editorIndex) => {
                        return (
                            <Box key={editorIndex} style={colorKeyEntry}>
                                <FiberManualRecordIcon style={{ ...colorKeyDot, color: editorColors[editorIndex] }} />
                                <Typography style={colorKeyName}>{editorName}</Typography>
                            </Box>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
}

export default PoemLinesAnimated;
