import * as React from "react";
import { Pagination } from "@mui/material";

import { paginatedItems, paginationContainer } from "./styles";
import { Poem } from "../Poem";
import NoResults from "../NoResults";

import { getPoems } from "../../services/poems";

import {
    IPoem,
    IPoems,
} from "../../types";

export default function PaginatedLibrary({ noResults }: { noResults: string}): JSX.Element {
    const [ page, setPage ] = React.useState(1);
    const [ poems, setPoems ] = React.useState<IPoem[]>([]);
    const PER_PAGE = 10;
    const count = Math.ceil(poems.length / PER_PAGE);

    React.useEffect(() => {
        const fetchPoems = async () => {
            const fetchedPoems: IPoems = await getPoems((page - 1) * PER_PAGE);
            setPoems(Object.values(fetchedPoems));
        };
        fetchPoems();
    }, []);

    function handlePageChange (event: React.ChangeEvent<unknown>, page: number): void {
        setPage(page);
    }

    const poemsContent = <div style={paginatedItems}>
        {Object.keys(poems).length < 1
            ? <NoResults key={0} message={noResults} />
            : poems
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
