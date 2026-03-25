import { headerHeight } from "constants/constants";
import type * as React from "react";
import { poemTypography } from "styles/common";

export const gameContainer: React.CSSProperties = {
    ...poemTypography,
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    flexWrap: "nowrap",
    height: `calc(100vh - ${headerHeight.toString()}px)`,
    justifyContent: "flex-start",
};
