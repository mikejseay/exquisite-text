import * as React from "react";
import PaginatedLibrary from "../../components/PaginatedLibrary";
import { poemsLibraryContainer } from "./styles";

import { MenuButtons } from "../../components/MenuButtons";

function Library(): JSX.Element {


    return <div style={poemsLibraryContainer}>
        <PaginatedLibrary noResults={"No poems found."} />
        <MenuButtons />
    </div>;
}

export default Library;
