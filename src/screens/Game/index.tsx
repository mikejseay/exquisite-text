import * as React from "react";

import GameTransition from "../../components/GameTransition";
import Leave from "../../components/Leave";
import LineInput from "../../components/LineInput";
import PoemsLines from "../../components/PoemsLines";
import { gameContainer } from "./styles";

function Game() {
    return (
        <div style={gameContainer} className={"game-container"}>
            <LineInput />
            <Leave />
            <PoemsLines />
            <GameTransition />
        </div>
    );
}

export default Game;
