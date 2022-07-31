import * as React from 'react';
import { useSocket } from "../App";
import { useNavigate } from "react-router-dom";

function GameTransition() {
  const navigate = useNavigate();
  const { socket } = useSocket();

  React.useEffect(() => {
    const navigateListener = (targetRoute: string) => {
      console.log("received navigate message to", targetRoute);
      navigate(targetRoute)
    };

    socket.on("navigate", navigateListener);

    return () => {
      socket.off("navigate", navigateListener);
    };
  }, [navigate, socket]);

  return (
    <React.Fragment/>
  );
}

export default GameTransition;
