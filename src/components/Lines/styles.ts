import * as React from "react";
import { poemTypography } from "../../styles/common";

export const spectatorLines: React.CSSProperties = {
    ...poemTypography,
    marginTop: "1em",
    textAlign: "center",
    whiteSpace: "pre-line",
};