import * as React from "react";
import { headerHeight } from "../../constants";

export const appHeader: React.CSSProperties = {
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    flexWrap: "nowrap",
    height: headerHeight,
    justifyContent: "space-between",
};

export const appTitle: React.CSSProperties = {
    fontFamily: "'Esteban', serif",
    fontSize: "24px",
    left: "50%",
    position: "absolute",
    transform: "translate(-50%, 0)",
};

export const app: React.CSSProperties = {
    height: "100%",
    width: "100%",
    // maxWidth: "90ch",
    margin: "auto",
};

export const possibleSocket: React.CSSProperties = {
    display: "flex",
    height: "100%",
    margin: "0 auto",
    // width: "calc(100vw - 1px)",
};
