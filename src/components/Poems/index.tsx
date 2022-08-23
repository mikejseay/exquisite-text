import * as React from "react";

import { useSocket } from "../App";
import { Poem } from "../Poem";

import {
    poemsBody,
} from "./styles";

import {
    IPoem,
    IPoems,
} from "../../types";

function Poems(): JSX.Element {
    const { socket } = useSocket();
    // The poems state is a plain object that contains each poem indexed by the poem ID.
    // Using React hooks, this state is updated inside the event handlers to reflect the changes provided by the server.
    const [ poems, setPoems ] = React.useState<IPoems>({} as IPoems);

    React.useEffect(() => {
    // Event handlers for the poem and the deletePoem events are set up for the Socket.IO connection.
        const poemListener = (poem: IPoem) => {
            setPoems((prevPoems) => {
                const newPoems = { ...prevPoems };
                newPoems[poem.id] = poem;
                return newPoems;
            });
        };

        socket.on("poem", poemListener);

        // tells the server for this client to do getPoems
        // since this is client-side, it only happens for this client
        socket.emit("getPoems");

        return () => {
            socket.off("poem", poemListener);
        };
    }, [ socket ]);

    return (
    // The component then displays all poems sorted by the timestamp at which they were created.
    // we can switch this so that it renders previous poems according to a view
        <div style={poemsBody}>
            {[ ...Object.values(poems) ]
                .sort((a, b) => Number(a.createdAt) - Number(b.createdAt))
                .map((poem) => (
                    <div key={poem.id} >
                        <Poem poem={poem} />
                    </div>
                ))}
        </div>
    );
}

export default Poems;
