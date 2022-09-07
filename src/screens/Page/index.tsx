import * as React from "react";
import { useParams } from "react-router-dom";

import { useSocket } from "../../components/App";
import { Poem } from "../../components/Poem";

import {
    poemsContainer,
} from "./styles";

import {
    IPoem,
} from "../../types";

function Page() {
    const { socket } = useSocket();
    const { id } = useParams();

    // The poems state is a plain object that contains each poem indexed by the poem ID.
    // Using React hooks, this state is updated inside the event handlers to reflect the changes provided by the server.
    const [ poem, setPoem ] = React.useState<IPoem>(
        {
            id: 0,
            content: "",
            createdAt: new Date(),
            title: "",
        },
    );

    React.useEffect(() => {
        // Event handlers for the poem and the deletePoem events are set up for the Socket.IO connection.
        const poemListener = (poem: IPoem) => {
            setPoem(poem);
        };

        socket.on("poem", poemListener);
        socket.emit("getPoemByID", Number(id));

        return () => {
            socket.off("poem", poemListener);
        };
    }, [ socket ]);

    return (
        // The component then displays all poems sorted by the timestamp at which they were created.
        // we can switch this so that it renders previous poems according to a view
        <div style={poemsContainer}>
            <Poem key={poem.id} poem={poem} />
        </div>
    );
}

export default Page;
