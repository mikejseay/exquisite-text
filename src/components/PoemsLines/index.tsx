import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import * as React from "react";

import { useSocket } from "../App";
import {
    poemsBody,
    poemTitle,
} from "./styles";

import {
    ILine,
    IUserTableInfo,
} from "../../types";
import PoemLines from "../PoemLines";

function PoemsLines() {
    const { socket } = useSocket();
    const [ poemsLines, setPoemsLines ] = React.useState<Array<ILine[]>>([]);
    const [ editorColors, setEditorColors ] = React.useState<Record<string, string>>({});

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
                        </AccordionDetails>
                    </Accordion>
                </div>
            ))}
        </div>
    );
}

export default PoemsLines;
