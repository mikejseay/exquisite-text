import * as React from "react";
import { headerHeight } from "constants/constants";
import { estebanFont } from "styles/common";

export const appHeader: React.CSSProperties = {
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    flexShrink: 0,
    flexWrap: "nowrap",
    height: headerHeight,
    justifyContent: "space-between",
};

export const appTitle: React.CSSProperties = {
    fontFamily: estebanFont,
    fontSize: "clamp(1rem, 6.67vw, 1.5rem)",
    left: "50%",
    position: "absolute",
    transform: "translate(-50%, 0)",
};

export const app: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    margin: "auto",
};

export const possibleSocket: React.CSSProperties = {
    display: "flex",
    height: "100%",
    margin: "0 auto",
    // width: "calc(100vw - 1px)",
};
