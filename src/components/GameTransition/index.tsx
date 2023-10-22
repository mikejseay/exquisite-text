import * as React from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../../context/SocketActions";

function GameTransition() {
    const navigate = useNavigate();

    React.useEffect(() => {
        const navigateListener = (targetRoute: string) => {
            navigate(targetRoute);
        };

        socket.on("navigate", navigateListener);

        return () => {
            socket.off("navigate", navigateListener);
        };
    }, [
        navigate,
        socket,
    ]);

    return (
        <React.Fragment />
    );
}

export default GameTransition;
