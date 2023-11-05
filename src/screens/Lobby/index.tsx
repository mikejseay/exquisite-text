import * as React from "react";

import GameSettings from "../../components/GameSettings";
import LeaveButton from "../../components/LeaveButton";
import UserTable from "../../components/UserTable";
import RoomCode from "../../components/RoomCode";

function Lobby() {
    return (
        <div>
            <RoomCode />
            <UserTable />
            <GameSettings />
            <LeaveButton />
        </div>
    );
}

export default Lobby;
