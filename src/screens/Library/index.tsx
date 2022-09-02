import * as React from "react";

import Poems from "../../components/Poems";

export default function Library(): JSX.Element {
    return (
        <main style={{ textAlign: "center" }}>
            <Poems />
        </main>
    );
}
