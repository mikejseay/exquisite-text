import * as React from "react";

import GameTransition from "../../components/GameTransition";
import Leave from "../../components/Leave";
import LineInput from "../../components/LineInput";
import Poems from "../../components/Poems";
import { appBody } from "./styles";

function Game() {
    return (
        <div style={appBody}>
            <LineInput />
            <Leave />
            <Poems />
            <GameTransition />
        </div>
    );
}

export default Game;
