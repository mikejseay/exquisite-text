import * as React from "react";

import { useSocket } from "../App";

const Lines = () => {
    const { socket } = useSocket();

    const [ lines, setLines ] = React.useState<Array<Array<string>>>([ [], [], [], [] ]);
    const [ lineEdits, setLineEdits ] = React.useState<Array<string>>([ "", "", "", "" ]);

    React.useEffect(() => {
        // const clearLinesListener = () => {
        //     setLines([ [], [], [], [] ]);
        // };

        const lineSpectatorListener = (poemIndex: number, line: string) => {
            setLines(prevLines => {
                return [ ...prevLines.slice(0, poemIndex), [ ...prevLines[poemIndex], line ], ...prevLines.slice(poemIndex + 1) ];
            },
            );
        };

        const lineEditSpectatorListener = (poemIndex: number, value: string) => {
            setLineEdits(prevLineEdits => {
                return [
                    ...prevLineEdits.slice(0, poemIndex),
                    value,
                    ...prevLineEdits.slice(poemIndex + 1),
                ];
            });
        };

        socket.on("lineSpectator", lineSpectatorListener);
        socket.on("lineEditSpectator", lineEditSpectatorListener);
        // socket.on("clearLines", clearLinesListener);

        // tells the server for this client to do getLines
        // since this is client-side, it only happens for this client
        setLines([ [], [], [], [] ]);
        socket.emit("getLines");

        return () => {
            socket.off("lineSpectator", lineSpectatorListener);
            socket.off("lineEditSpectator", lineEditSpectatorListener);
        };
    }, [ socket ]);

    return (
        <div className={"lines-outer"} style={
            {
                fontFamily: "'Esteban', serif",
                fontSize: "18px",
                marginTop: "1em",
                textAlign: "center",
                whiteSpace: "pre-line",
            }
        }>
            {lines.map((lineArray, poemIndex) => {
                return <div className={"lines-inner"} style={{ marginBottom: "2em" }} key={poemIndex}>
                    <div className={"lines-array"}>{
                        lineArray.join("\n")
                    }</div>
                    <div className={"lines-edit"}>{lineEdits[poemIndex]}</div>
                </div>;
            },
            )}
        </div>
    );
};

export default Lines;
