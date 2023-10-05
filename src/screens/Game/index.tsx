import * as React from "react";

import GameTransition from "../../components/GameTransition";
import LeaveButton from "../../components/LeaveButton";
import LineInput from "../../components/LineInput";
import { gameContainer } from "./styles";

function Game() {
    return (
        <div style={gameContainer} className={"game-container"}>
            <LineInput />
            <LeaveButton />
            <GameTransition />
        </div>
    );
}

export default Game;
