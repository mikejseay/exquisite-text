import * as React from "react";
import { useParams } from "react-router-dom";
import isNil from "lodash/isNil";

import { Poem } from "../../components/Poem";
import { getPoemById } from "../../services/poems";
import Poem404 from "../Poem404";
import { poemsContainer } from "./styles";

import {
    IPoem,
} from "../../types";

function Page(): JSX.Element {
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
        if (isNil(id)) {
            return;
        }

        async function fetchPoem() {
            const fetchedPoem = await getPoemById(Number(id));
            setPoem(fetchedPoem);
        }
    
        fetchPoem();
    }, []);

    const poemContent = isNil(poem) || poem.id === 0
        ? <Poem404 content="No poem found." />
        : <Poem key={poem.id} poem={poem} />;
    
    return (
        // The component then displays all poems sorted by the timestamp at which they were created.
        // we can switch this so that it renders previous poems according to a view
        <div style={poemsContainer}>
            {poemContent}
        </div>
    );
}

export default Page;
