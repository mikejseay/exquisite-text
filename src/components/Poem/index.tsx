import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import CopyAllIcon from "@mui/icons-material/CopyAll";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import IconButton from "@mui/material/IconButton";
import React from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

import {
    poemFont,
    poemTitle,
} from "../Poem/styles";

import { IPoem } from "../../types";

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
                        onCopy={() => setIsCopied(true)}>
                        <IconButton>
                            <CopyAllIcon />
                        </IconButton>
                    </CopyToClipboard>
                    {copyStatus}
                </AccordionDetails>
            </Accordion>
        </div>
    );
}
  
  