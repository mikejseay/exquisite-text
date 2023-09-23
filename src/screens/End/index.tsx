import * as React from "react";
import MultiplePoems from "../../components/MultiplePoems";
import { centered } from "./styles";

function End({ shouldTest }: { shouldTest: boolean }) {
    return (
        <div style={centered}>
            <span>Poem completed! If you&apos;d like to play again, make a new room.</span>
            <br />
            <MultiplePoems shouldTest={shouldTest} />
        </div>
    );
}

export default End;
