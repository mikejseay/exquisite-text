import * as React from "react";
import { headerHeight } from "../../constants";

export const gameContainer: React.CSSProperties = {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    flexWrap: "nowrap",
    fontFamily: "'Esteban', serif",
    fontSize: "18px",
    height: "calc(100vh - " + headerHeight.toString() + "px)",
    justifyContent: "flex-start",
};
