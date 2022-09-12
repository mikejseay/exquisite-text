import * as React from "react";
import { Pagination } from "@mui/material";

import { paginatedItems, paginationContainer } from "./styles";
import { Poem } from "../Poem";
import NoResults from "../NoResults";

import { getPoemsOfPage } from "../../services/poems";

import {
    IPoem,
    IPoems,
} from "../../types";
import { nPagesToShow, nPoemsPerPage } from "../../constants";

export default function PaginatedLibrary({ noResults }: { noResults: string}): JSX.Element {
    const [ page, setPage ] = React.useState(1);
    const [ poems, setPoems ] = React.useState<IPoem[]>([]);

    React.useEffect(() => {
        console.log("fetchPoems useEffect invoked with page", page);
        const fetchPoems = async () => {
            const fetchedPoems: IPoems = await getPoemsOfPage((page - 1) * nPoemsPerPage);
            setPoems(Object.values(fetchedPoems));
        };
        fetchPoems();
    }, [ page ]);

    function handlePageChange (event: React.ChangeEvent<unknown>, page: number): void {
        setPage(page);
        console.log("page changed to", page);
    }

    const poemsContent = <div style={paginatedItems}>
        {Object.keys(poems).length < 1
            ? <NoResults key={0} message={noResults} />
            : poems
                .sort((a, b) => Number(a.createdAt) - Number(b.createdAt))
                .map((poem) => <Poem key={poem.id} poem={poem} />)}</div>;

    const pagination = <div style={paginationContainer}>
        <Pagination
            count={nPagesToShow}
            onChange={handlePageChange}
            page={page}
        />
    </div>;

    return (
        <>
            {pagination}
            {poemsContent}
            {pagination}
        </>
    );
}
