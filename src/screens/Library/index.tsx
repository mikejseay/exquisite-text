import * as React from "react";
import PaginatedLibrary from "../../components/PaginatedLibrary";
import { poemsLibraryContainer } from "./styles";

function Library(): JSX.Element {


    return <div style={poemsLibraryContainer}>
        <PaginatedLibrary noResults={"No poems found."} />
    </div>;
}

export default Library;
