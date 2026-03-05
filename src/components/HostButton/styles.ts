import * as React from "react";
import { FABDiameter, FABSpace } from "../../constants";

export const hostButtonLabel: React.CSSProperties = {
    fontSize: "9px",
    lineHeight: "1.2",
    color: "inherit",
    fontFamily: "sans-serif",
    fontWeight: 600,
    whiteSpace: "pre-line",
};

export const hostButtonWrapper: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "6px",
};

export const hostButtonsContainer: React.CSSProperties = {
    position: "absolute",
    left: FABSpace,
    top: FABSpace,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    alignItems: "flex-start",
    zIndex: 11,
};

export const roomCodeStyles: React.CSSProperties = {
    position: "absolute",
    left: FABDiameter + FABSpace + 60,
    top: 0,
};
