import LeaveButton from "components/LeaveButton/LeaveButton";
import LineInput from "components/LineInput/LineInput";
import { useSocketInfo } from "context/SocketInfoProvider";
import Canvas from "screens/Canvas/Canvas";
import { gameContainer } from "screens/Game/styles";
import { Medium } from "types/types";

function Game() {
    const { medium } = useSocketInfo();
    const gameComponent = medium === Medium.POETRY ? <LineInput /> : <Canvas />;
    return (
        <div style={gameContainer} className={"game-container"}>
            {gameComponent}
            <LeaveButton />
        </div>
    );
}

export default Game;
