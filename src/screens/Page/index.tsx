import * as React from "react";
import { useParams } from "react-router-dom";

import { Poem } from "../../components/Poem";
import {
    poemsContainer,
} from "./styles";

import {
    IPoem,
} from "../../types";

function Page() {
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
        async function fetchPoem() {
            try {
                const response = await fetch(
                    `http://localhost:3000/poems/${id}`,
                );
                const json = await response.json();
                console.log(json);
                setPoem(json);
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
            <Poem key={poem.id} poem={poem} />
        </div>
    );
}

export default Page;
