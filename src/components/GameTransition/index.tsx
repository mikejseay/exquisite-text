import * as React from 'react';
import { useSocket } from "../App";
import { useNavigate } from "react-router-dom";

function useStateRefString(initialValue: string) {
  const [value, setValue] = React.useState(initialValue);
  const ref = React.useRef(value);

  React.useEffect(() => {
    ref.current = value;
  }, [value]);

  return [value, setValue, ref] as const;
}

function GameTransition() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [role, setRole, roleRef] = useStateRefString("");

  React.useEffect(() => {
    const gameStartListener = () => {
      console.log("received gameStart message and role currently", role);
      if (roleRef.current === "Editor") {
        // trigger all editors to define their own turnOrderPosition and targetEditor
        socket.emit("editorsDefineTurns");
        navigate("/game");
      } else if (roleRef.current === "Spectator") {
        navigate("/spectate");
      }
    };

    const roleListener = (roleFromServer: string) => {
      setRole(roleFromServer);
    };

    socket.on("enactStartGame", gameStartListener);
    socket.on("sendRole", roleListener);

    socket.emit("getRole");

    return () => {
      socket.off("enactStartGame", gameStartListener);
      socket.off("sendRole", roleListener);
    };
  }, [socket]);

  return (
    <div className={"gameTransition"}>
      {"I'm the gameTransition element and I think your role is " + role}
    </div>
  );
}

export default GameTransition;
