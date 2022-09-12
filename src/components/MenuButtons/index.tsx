import * as React from "react";
import HostButton from "../HostButton";
import { LibraryButton } from "../LibraryButton";

export function MenuButtons(): JSX.Element {
    return <>
        <LibraryButton />
        <HostButton />
    </>;
}
