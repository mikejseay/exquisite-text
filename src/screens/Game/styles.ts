import * as React from "react";
import { headerHeight } from "../../constants";
import { poemTypography } from "../../styles/common";

export const gameContainer: React.CSSProperties = {
    ...poemTypography,
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    flexWrap: "nowrap",
    height: "calc(100vh - " + headerHeight.toString() + "px)",
    justifyContent: "flex-start",
};
