import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import * as React from "react";

import { useSocket } from "../App";
import {
    poemsBody,
    poemFont,
    poemTitle,
} from "./styles";

import {
    ILine,
    IPoem,
    IPoems,
    IUserTableInfo,
} from "../../types";

function PoemLines() {
    const { socket } = useSocket();
    const [ poemLines, setPoemLines ] = React.useState<ILine[]>([]);
    const [ editorColors, setEditorColors ] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
    // Event handlers for the poem and the deletePoem events are set up for the Socket.IO connection.
        const poemLinesListener = (myPoemLines: ILine[]) => {
            setPoemLines(myPoemLines);
        };

        const userTableInfoListener = (info: IUserTableInfo) => {
            setEditorColors(info.editorColors);
        };

        socket.on("poemLines", poemLinesListener);
        socket.on("userTableInfo", userTableInfoListener);

        // socket.emit("getPoemLines");
        socket.emit("getUserTableInfo"); // initial populate

        return () => {
            socket.off("poemLines", poemLinesListener);
            socket.off("userTableInfo", userTableInfoListener);
        };
    }, [ socket ]);

    return (
        <div style={poemsBody}>
            {poemLines.map((line) => {
                return <div key={line.lineIndex} style={{whiteSpace: "pre-line"}}>
                    <span className={"first-part"} key={line.lineIndex} style={{color: editorColors[line.passerDevice]}}>
                        {line.content.slice(0, line.editLength)}
                    </span>
                    <span className={"second-part"} key={line.lineIndex} style={{color: editorColors[line.authorDevice]}}>
                        {line.content.slice(line.editLength)}
                    </span>
                </div>;
            })}
        </div>
    );
}

export default PoemLines;
