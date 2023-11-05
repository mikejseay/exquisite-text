import * as React from "react";

import { lineSepString } from "../../constants";
import { spectatorLines } from "./styles";
import { useSocketInfo } from "../../context/SocketInfoProvider";

const Lines = () => {

    const { lines, lineEdits } = useSocketInfo();
    if (!lines || !lineEdits) {
        return null;
    }

    return (
        <div className={"lines-outer"} style={spectatorLines}>
            {lines.map((lineArray, poemIndex) => {
                return <div className={"lines-inner"} style={{ marginBottom: "2em" }} key={poemIndex}>
                    <div className={"lines-array"}>
                        {lineArray.join(lineSepString)}
                    </div>
                    <div className={"lines-edit"}>
                        {lineEdits[poemIndex]}
                    </div>
                </div>;
            },
            )}
        </div>
    );
};

export default Lines;
