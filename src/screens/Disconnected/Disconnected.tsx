import * as React from "react";
import { textCentered } from "styles/common";

function Disconnected() {
    return (
        <div style={textCentered}>
            You connected from another tab, so I disconnected you here. Sorry!
        </div>
    );
}

export default Disconnected;
