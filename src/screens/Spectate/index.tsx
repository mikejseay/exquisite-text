import * as React from "react";

import GameTransition from "../../components/GameTransition";
import Lines from "../../components/Lines";

function Spectate() {
    return (
        <div>
            <Lines />
            <GameTransition />
        </div>
    );
}

export default Spectate;
