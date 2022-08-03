import * as React from "react";

import GameSettings from "../../components/GameSettings";
import GameTransition from "../../components/GameTransition";
import UserTable from "../../components/UserTable";

function Lobby() {
    return (
        <div >
            <UserTable />
            <GameSettings />
            <GameTransition />
        </div>
    );
}

export default Lobby;
