import * as React from "react";
import { Pagination } from "@mui/material";

import { paginatedItems, paginationContainer } from "./styles";
import { Poem } from "../Poem";
import NoResults from "../NoResults";

import { getItemsOnCurrentPage } from "../../helpers";
import { getPoems } from "../../services/poems";

import {
    IPoem,
    IPoems,
} from "../../types";
import isNil from "lodash/isNil";
import { nPoemsPerPage } from "../../constants";

export default function PaginatedLibrary({ noResults }: { noResults: string}): JSX.Element {
    const [ page, setPage ] = React.useState(1);
    const [ poems, setPoems ] = React.useState<IPoem[]>([]);
    const nPages = Math.ceil(poems.length / nPoemsPerPage);

    React.useEffect(() => {
        const fetchPoems = async () => {
            const fetchedPoems: IPoems = await getPoems();
            setPoems(Object.values(fetchedPoems));
        };
        fetchPoems();
    }, []);

    function handlePageChange (event: React.ChangeEvent<unknown>, page: number): void {
        setPage(page);
    }
    const itemsOnCurrentPage = getItemsOnCurrentPage(poems, page, nPoemsPerPage);
    const poemsContent = <div style={paginatedItems}>
        {itemsOnCurrentPage.length < 1
            ? <NoResults key={0} message={noResults} />
            : itemsOnCurrentPage
                .sort((a, b) => Number(a.createdAt) - Number(b.createdAt))
                .map((poem) => isNil(poem)
                    ? null
                    : <Poem key={poem.id} poem={poem} />)}</div>;

    const pagination = <div style={paginationContainer}>
        <Pagination
            count={nPages}
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
