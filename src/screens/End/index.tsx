import * as React from "react";
import MultiplePoems from "../../components/MultiplePoems";
import { centered } from "./styles";

function End() {
    return (
        <div style={centered}>
            <span>Poem completed! If you&apos;d like to play again, make a new room.</span>
            <br />
            <MultiplePoems />
        </div>
    );
}

export default End;
