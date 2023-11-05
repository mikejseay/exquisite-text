import * as React from "react";

import LeaveButton from "../../components/LeaveButton";
import LineInput from "../../components/LineInput";
import { gameContainer } from "./styles";

function Game() {
    return (
        <div style={gameContainer} className={"game-container"}>
            <LineInput />
            <LeaveButton />
        </div>
    );
}

export default Game;
