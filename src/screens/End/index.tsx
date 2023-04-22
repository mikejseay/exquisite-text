import * as React from "react";
import PoemsLines from "../../components/PoemsLines";
import { centered } from "./styles";

function End() {
    return (
        <div style={centered}>
            <span>Poem completed! If you&apos;d like to play again, make a new room.</span>
            <br />
            <PoemsLines />
        </div>
    );
}

export default End;
