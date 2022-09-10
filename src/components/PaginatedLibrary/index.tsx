import * as React from "react";
import { Pagination } from "@mui/material";

import { paginatedItems, paginationContainer } from "./styles";
import { IPoem } from "../../types";
import { Poem } from "../Poem";
import NoResults from "../NoResults";
import { getItemsOnCurrentPage } from "../../helpers";

type Props = {
    content: IPoem[],
    noResults: string,
}

export default function PaginatedLibrary({ content, noResults }: Props): JSX.Element {
    const [ page, setPage ] = React.useState(1);
    
    const PER_PAGE = 10;
    const count = Math.ceil(content.length / PER_PAGE);

    function handlePageChange (event: React.ChangeEvent<unknown>, page: number): void {
        setPage(page);
    }

    const poemsContent = <div style={paginatedItems}>
        {Object.keys(content).length < 1
            ? <NoResults key={0} message={noResults} />
            : getItemsOnCurrentPage(content, page, PER_PAGE)
                .sort((a, b) => Number(a.createdAt) - Number(b.createdAt))
                .map((poem) => <Poem key={poem.id} poem={poem} />)}</div>;

    const pagination = <div style={paginationContainer}>
        <Pagination
            count={count}
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
