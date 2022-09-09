import * as React from "react";

import { Poem } from "../../components/Poem";
import { getPoems } from "../../services/poems";
import { poemsContainer } from "./styles";

import { IPoems } from "../../types";
import Poem404 from "../Poem404";

function Library(): JSX.Element {
    // The poems state is a plain object that contains each poem indexed by the poem ID.
    // Using React hooks, this state is updated inside the event handlers to reflect the changes provided by the server.
    const [ poems, setPoems ] = React.useState<IPoems>({});

    React.useEffect(() => {
        const fetchPoems = async () => {
            const fetchedPoems = await getPoems();
            setPoems(fetchedPoems);
        };
        fetchPoems();
    }, []);

    const poemsContent = Object.keys(poems).length === 0
        ? <Poem404 content="No poems found." />
        : [ ...Object.values(poems) ]
            .sort((a, b) => Number(a.createdAt) - Number(b.createdAt))
            .map((poem) => (
                <Poem key={poem.id} poem={poem} />
            ));

    return (
        // The component then displays all poems sorted by the timestamp at which they were created.
        // we can switch this so that it renders previous poems according to a view
        <div style={poemsContainer}>
            {poemsContent}
        </div>
    );
}

export default Library;
