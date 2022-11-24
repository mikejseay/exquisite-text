import * as React from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { CopyToClipboard } from "react-copy-to-clipboard";
import IconButton from "@mui/material/IconButton";

import {
    poemsBody,
} from "./styles";
import {
    ILine,
} from "../../types";

import { lineSepString, shortDur } from "../../constants";

function PoemLines({ poemLines, editorColors }: { poemLines: ILine[], editorColors: Record<string, string> }) {
    const [ isCopied, setIsCopied ] = React.useState<boolean>(false);
    const copyStatus = isCopied
        ? <span style={{ color: "gray" }}>Copied.</span>
        : null;

    return (
        <div style={poemsBody}>
            {poemLines.map((line) => {
                return <div key={line.lineIndex} style={{ whiteSpace: "pre-line" }}>
                    <span className={"first-part"} key={line.lineIndex} style={{ color: editorColors[line.passerDevice] }}>
                        {line.content.slice(0, line.editLength)}
                    </span>
                    <span className={"second-part"} key={line.lineIndex} style={{ color: editorColors[line.authorDevice] }}>
                        {line.content.slice(line.editLength)}
                    </span>
                </div>;
            })}
            <CopyToClipboard text={poemLines.map(line => line.content).join(lineSepString)}
                onCopy={() => {
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), shortDur);
                }}>
                <IconButton>
                    <ContentCopyIcon />
                </IconButton>
            </CopyToClipboard>
            {copyStatus}
        </div>
    );
}

export default PoemLines;