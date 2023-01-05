import * as React from "react";

import { useSocket } from "../App";

function RoomCode() {
    const { socket } = useSocket();

    const [ roomCode, setRoomCode ] = React.useState<string>("");

    // listen for room codes
    React.useEffect(() => {

        // Event handlers for the line and the deleteLine events are set up for the Socket.IO connection.
        const roomCodeListener = (info: string) => {
            setRoomCode(info);
        };
        socket.on("roomCode", roomCodeListener);
        socket.emit("getRoomCode"); // initial populate

        return () => {
            socket.off("roomCode", roomCodeListener);
        };
    }, [ socket ]);

    return (
        <div style={{ textAlign: "center" }} >
            <h1>Room Code: {roomCode}</h1>
        </div>
    );
}

export default RoomCode;
