import * as React from "react";

import GameTransition from "../../components/GameTransition";
import Lines from "../../components/Lines";
import Leave from "../../components/Leave";

function Spectate() {
    return (
        <div>
            <Lines />
            <Leave />
            <GameTransition />
        </div>
    );
}

export default Spectate;
