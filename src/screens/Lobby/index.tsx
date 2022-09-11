import * as React from "react";

import GameSettings from "../../components/GameSettings";
import GameTransition from "../../components/GameTransition";
import LeaveButton from "../../components/LeaveButton";
import UserTable from "../../components/UserTable";

function Lobby() {
    return (
        <div >
            <UserTable />
            <GameSettings />
            <LeaveButton />
            <GameTransition />
        </div>
    );
}

export default Lobby;
