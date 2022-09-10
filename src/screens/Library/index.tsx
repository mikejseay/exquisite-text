import * as React from "react";
import PaginatedLibrary from "../../components/PaginatedLibrary";
import { poemsLibraryContainer } from "./styles";
import { getPoems } from "../../services/poems";

import {
    IPoem,
    IPoems,
} from "../../types";
import { MenuButtons } from "../../components/MenuButtons";

function Library(): JSX.Element {
    const [ poems, setPoems ] = React.useState<IPoem[]>([]);

    React.useEffect(() => {
        const fetchPoems = async () => {
            const fetchedPoems: IPoems = await getPoems();
            setPoems(Object.values(fetchedPoems));
        };
        fetchPoems();
    }, []);

    return <div style={poemsLibraryContainer}>
        <PaginatedLibrary content={poems} noResults={"No poems found."} />
        <MenuButtons />
    </div>;
}

export default Library;
