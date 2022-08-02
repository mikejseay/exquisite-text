import LineInput from "../../components/LineInput";
import Poems from "../../components/Poems";
import { appBody } from "./styles"

function Game() {
  return (
    <div style={appBody}>
      <LineInput />
      <Poems />
    </div>
  );
}

export default Game;
