import * as React from "react";

import LeaveButton from "../../components/LeaveButton";
import LineInput from "../../components/LineInput";
import Canvas from "../Canvas";
import { gameContainer } from "./styles";
import { useSocketInfo } from "../../context/SocketInfoProvider";
import { Medium } from "../../types";

function Game() {
    const { medium } = useSocketInfo();
    const gameComponent = medium === Medium.POETRY
        ? <LineInput />
        : <Canvas />;
    return (
        <div style={gameContainer} className={"game-container"}>
            {gameComponent}
            <LeaveButton />
        </div>
    );
}

export default Game;
