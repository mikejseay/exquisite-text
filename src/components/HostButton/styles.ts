import * as React from "react";
import { FABDiameter, FABSpace } from "../../constants";

export const hostButtonLabel: React.CSSProperties = {
    fontSize: "9px",
    lineHeight: "1.2",
    marginTop: "4px",
    textAlign: "center",
    color: "inherit",
    fontFamily: "sans-serif",
    fontWeight: 600,
    whiteSpace: "pre-line",
};

export const hostButtonWrapper: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
};

export const hostButtonsContainer: React.CSSProperties = {
    position: "absolute",
    left: FABSpace,
    top: FABSpace,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    alignItems: "center",
};

export const roomCodeStyles: React.CSSProperties = {
    paddingLeft: "2em",
    position: "absolute",
    top: FABDiameter + 2 * FABSpace,
};
