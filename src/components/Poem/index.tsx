import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import IconButton from "@mui/material/IconButton";
import React from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

import {
    poemFont,
    poemTitle,
} from "./styles";

import { IPoem } from "../../types";
import { shortDur } from "../../constants";

export function Poem({ poem }: { poem: IPoem }): JSX.Element {
    const [ isCopied, setIsCopied ] = React.useState<boolean>(false);
    const copyStatus = isCopied
        ? <span style={{ color: "red" }}>Copied.</span>
        : null;

    return (
        <div className="poem-container">
            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1a-content"
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
                    <CopyToClipboard text={poem.content}
                        onCopy={() => {
                            setIsCopied(true);
                            setTimeout(() => setIsCopied(false), shortDur);
                        }}>
                        <IconButton>
                            <ContentCopyIcon />
                        </IconButton>
                    </CopyToClipboard>
                    {copyStatus}
                </AccordionDetails>
            </Accordion>
        </div>
    );
}
  
  