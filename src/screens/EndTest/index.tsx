import * as React from "react";
import MultiplePoemsTest from "../../components/MultiplePoemsTest";
import { centered } from "./styles";

function EndTest() {
    return (
        <div style={centered}>
            <span>Poem completed! If you&apos;d like to play again, make a new room.</span>
            <br />
            <MultiplePoemsTest />
        </div>
    );
}

export default EndTest;
