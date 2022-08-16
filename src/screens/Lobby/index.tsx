import * as React from "react";

import GameSettings from "../../components/GameSettings";
import GameTransition from "../../components/GameTransition";
import Leave from "../../components/Leave";
import UserTable from "../../components/UserTable";

function Lobby() {
    return (
        <div >
            <UserTable />
            <GameSettings />
            <Leave />
            <GameTransition />
        </div>
    );
}

export default Lobby;
