import type * as React from "react";
import { textCentered } from "styles/common";

export const roomCodeWrapper: React.CSSProperties = {
    ...textCentered,
};

export const roomCodeLabel: React.CSSProperties = {
    fontSize: "1.1rem",
    opacity: 0.7,
};

export const roomCodeValue: React.CSSProperties = {
    fontSize: "2.5rem",
    fontWeight: "bold",
    letterSpacing: "0.15em",
};
