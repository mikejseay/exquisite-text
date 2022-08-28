import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import IconButton from "@mui/material/IconButton";
import * as React from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

import { useSocket } from "../App";
import PoemLines from "../PoemLines";
import {
    poemsBody,
    poemTitle,
} from "./styles";

import {
    ILine,
    IUserTableInfo,
} from "../../types";

function PoemsLines() {
    const { socket } = useSocket();
    const [ poemsLines, setPoemsLines ] = React.useState<Array<ILine[]>>([]);
    const [ editorColors, setEditorColors ] = React.useState<Record<string, string>>({});
    const [ isCopied, setIsCopied ] = React.useState<boolean>(false);
    const copyStatus = isCopied
        ? <span style={{ color: "gray" }}>Copied.</span>
        : null;

    React.useEffect(() => {
    // Event handlers for the poem and the deletePoem events are set up for the Socket.IO connection.
        const poemsLinesListener = (myPoemLines: ILine[]) => {
            setPoemsLines(prevPoemsLines => {
                return [ ...prevPoemsLines, myPoemLines ];
            },
            );
        };

        const userTableInfoListener = (info: IUserTableInfo) => {
            setEditorColors(info.editorColors);
        };

        socket.on("poemLines", poemsLinesListener);
        socket.on("userTableInfo", userTableInfoListener);

        // socket.emit("getPoemLines");
        socket.emit("getUserTableInfo"); // initial populate

        return () => {
            socket.off("poemLines", poemsLinesListener);
            socket.off("userTableInfo", userTableInfoListener);
        };
    }, [ socket ]);

    return (
        <div className={"poems-with-lines"} style={poemsBody}>
            {poemsLines.map( (poemLines, poemLinesIndex) => (
                <div key={poemLinesIndex} className="poem-container">
                    <Accordion>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1a-content"
                            id="panel1a-header"
                        >
                            <div style={poemTitle} className={"poem-title"}>
                                <strong>{"exquisite text #" + poemLinesIndex.toString()}</strong>
                            </div>
                        </AccordionSummary>
                        <AccordionDetails>
                            <PoemLines poemLines={poemLines} editorColors={editorColors} />
                            <CopyToClipboard text={poemLines.map(line => line.content).join("\n")}
                                onCopy={() => {
                                    setIsCopied(true);
                                    setTimeout(() => setIsCopied(false), 3000);
                                }}>
                                <IconButton>
                                    <ContentCopyIcon />
                                </IconButton>
                            </CopyToClipboard>
                            {copyStatus}
                        </AccordionDetails>
                    </Accordion>
                </div>
            ))}
        </div>
    );
}

export default PoemsLines;
