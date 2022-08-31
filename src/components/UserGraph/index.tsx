import * as React from "react";
import Graph from "react-graph-vis";

import { useSocket } from "../App";
import { IGraph, IUserTableInfo } from "../../types";
import { editorColorArr } from "../../constants";

function UserGraph() {
    const options = {
        width: "300px",
        height: "300px",
        clickToUse: true,
        layout: {
            hierarchical: false,
        },
        edges: {
            color: "#000000",
            smooth: true,
        },
        interaction: {
            hover: true,
        },
    };

    const { socket } = useSocket();

    const [ spectatorArr, setSpectatorArr ] = React.useState<Array<string>>([]);

    const [ graph, setGraph ] = React.useState<IGraph>({
        nodes: [],
        edges: [],
    });

    // listen for arrays of editors and spectators
    React.useEffect(() => {

        // Event handlers for the line and the deleteLine events are set up for the Socket.IO connection.
        const userTableInfoListener = (info: IUserTableInfo) => {
            const nEditors = info["editors"].length;
            setGraph({
                nodes: info["editors"].map((name, nameIndex) => (
                    {   "id": nameIndex,
                        "label": name,
                        "color": editorColorArr[nameIndex] }
                )),
                edges: [ ...Array(nEditors).keys() ].map((v) => ({ "from": v, "to": (v + 1) % nEditors })),
            });
            setSpectatorArr(info["spectators"]);
        };

        socket.on("userTableInfo", userTableInfoListener);
        socket.emit("getUserTableInfo"); // initial populate

        return () => {
            socket.off("userTableInfo", userTableInfoListener);
        };
    }, [ socket ]);

    return (
        <React.Fragment>
            <div className={"userGraph"} style={{ display: "flex", justifyContent: "center" }}>
                <Graph graph={graph} options={options} style={{ height: "300px" }} />
            </div>
            <div className={"spectators"} style={{ textAlign: "center" }}>
                <h2>Spectators:</h2>
                {spectatorArr.map((name, nameIndex) => {
                    return (
                        <p key={nameIndex}>{name}</p>
                    );
                })}
            </div>
        </React.Fragment>
    );
}

export default UserGraph;
