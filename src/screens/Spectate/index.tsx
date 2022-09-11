import * as React from "react";

import GameTransition from "../../components/GameTransition";
import Lines from "../../components/Lines";
import LeaveButton from "../../components/LeaveButton";

function Spectate() {
    return (
        <div>
            <Lines />
            <LeaveButton />
            <GameTransition />
        </div>
    );
}

export default Spectate;
