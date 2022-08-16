import * as React from "react";

import GameTransition from "../../components/GameTransition";
import Leave from "../../components/Leave";
import LineInput from "../../components/LineInput";
import Poems from "../../components/Poems";
import { gameContainer } from "./styles";

function Game() {
    return (
        <div style={gameContainer} className={"game-container"}>
            <LineInput />
            <Leave />
            <Poems />
            <GameTransition />
        </div>
    );
}

export default Game;
