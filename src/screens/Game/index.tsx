import * as React from "react";

import GameTransition from "../../components/GameTransition";
import Leave from "../../components/Leave";
import LineInput from "../../components/LineInput";
// import Poems from "../../components/Poems";
import PoemLines from "../../components/PoemLines";
import { gameContainer } from "./styles";

function Game() {
    return (
        <div style={gameContainer} className={"game-container"}>
            <LineInput />
            <Leave />
            <PoemLines />
            {/*<Poems />*/}
            <GameTransition />
        </div>
    );
}

export default Game;
