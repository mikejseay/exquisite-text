import * as React from "react";

import GameSettings from "../../components/GameSettings";
import GameTransition from "../../components/GameTransition";
import Leave from "../../components/Leave";
import UserGraph from "../../components/UserGraph";
// import UserTable from "../../components/UserTable";

function Lobby() {
    return (
        <div >
            {/*<UserTable />*/}
            <UserGraph />
            <GameSettings />
            <Leave />
            <GameTransition />
        </div>
    );
}

export default Lobby;
