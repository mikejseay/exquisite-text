import * as React from "react";

import { Poem } from "../../components/Poem";
import { poemsContainer } from "./styles";

import { IPoems } from "../../types";

function Library() {
    // The poems state is a plain object that contains each poem indexed by the poem ID.
    // Using React hooks, this state is updated inside the event handlers to reflect the changes provided by the server.
    const [ poems, setPoems ] = React.useState<IPoems>({});

    React.useEffect(() => {
        async function fetchPoem() {
            try {
                const response = await fetch(
                    "http://localhost:3000/poems/0",
                );
                const json = await response.json();
                setPoems(json);
            } catch (error) {
                console.log(error);
            }
        }
    
        fetchPoem();
    }, []);

    return (
        // The component then displays all poems sorted by the timestamp at which they were created.
        // we can switch this so that it renders previous poems according to a view
        <div style={poemsContainer}>
            {[ ...Object.values(poems) ]
                .sort((a, b) => Number(a.createdAt) - Number(b.createdAt))
                .map((poem) => (
                    <Poem key={poem.id} poem={poem} />
                ))}
        </div>
    );
}

export default Library;
