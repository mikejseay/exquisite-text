import * as React from "react";
import {
    poemsBody,
} from "./styles";
import {
    ILine,
} from "../../types";

function PoemLines({ poemLines, editorColors }: {poemLines: ILine[], editorColors: Record<string, string>}) {
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
        </div>
    );
}

export default PoemLines;