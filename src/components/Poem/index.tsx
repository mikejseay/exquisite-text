import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import CopyAllIcon from "@mui/icons-material/CopyAll";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip/Tooltip";
import React from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

import {
    poemContainer,
    poemFont,
    poemTitle,
} from "./styles";
import { IPoem } from "../../types";
import { shortDur } from "../../constants";

export function Poem({ poem }: { poem: IPoem }): JSX.Element {
    const [ isCopied, setIsCopied ] = React.useState<boolean>(false);
    const copyStatus = isCopied
        ? <><br /><span style={{ position: "absolute" }}><sup>Copied.</sup></span></>
        : null;

    function onCopy(): void {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), shortDur);
    }
    return (
        <div className="poem-container" style={poemContainer}>
            <Accordion>
                <AccordionSummary
                    aria-controls="panel1a-content"
                    expandIcon={<ExpandMoreIcon />}
                    id="panel1a-header"
                >
                    <div style={poemTitle} className={"poem-title"}>
                        <strong>{poem.title}</strong>
                    </div>
                </AccordionSummary>
                <AccordionDetails>
                    <div className={"poem"} style={poemFont}>
                        {poem.content}
                    </div>
                    <CopyToClipboard
                        onCopy={onCopy}
                        text={poem.content}
                    >
                        <Tooltip title="Copy poem text to clipboard">
                            <IconButton>
                                <CopyAllIcon />
                            </IconButton>
                        </Tooltip>
                    </CopyToClipboard>
                    <CopyToClipboard
                        onCopy={onCopy}
                        text={`${location.origin}/page/${poem.id}`}
                    >
                        <Tooltip title="Copy poem permalink to clipboard">
                            <IconButton>
                                <ContentCopyIcon />
                            </IconButton>
                        </Tooltip>
                    </CopyToClipboard>
                    {copyStatus}
                </AccordionDetails>
            </Accordion>
        </div>
    );
}

