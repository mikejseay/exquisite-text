import * as React from "react";

import GameTransition from "../../components/GameTransition";
import LineInput from "../../components/LineInput";
import Poems from "../../components/Poems";
import { appBody } from "./styles";

function Game() {
    return (
        <div style={appBody}>
            <LineInput />
            <Poems />
            <GameTransition />
        </div>
    );
}

export default Game;
