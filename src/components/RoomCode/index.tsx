import * as React from "react";

import { socket } from "../../context/SocketActions";

function RoomCode() {

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
            <h2>Room Code: {roomCode}</h2>
        </div>
    );
}

export default RoomCode;
