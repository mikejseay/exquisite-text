import * as React from "react";
import CreateGame from "../CreateGame";
import { LibraryButton } from "../LibraryButton";

export function MenuButtons(): JSX.Element {
    return <>
        <LibraryButton />
        <CreateGame />
    </>;
}