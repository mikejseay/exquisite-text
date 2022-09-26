import * as React from "react";

import HostButton from "../HostButton";
import { LibraryButton } from "../LibraryButton";
import Tutorial from "../Tutorial";

export function MenuButtons(): JSX.Element {
    return <>
        <Tutorial />
        <LibraryButton />
        <HostButton />
    </>;
}
