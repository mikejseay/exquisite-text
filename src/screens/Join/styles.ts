import * as React from "react";

export const joinFormWrapper: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    marginTop: "clamp(1em, 8vh, 6em)",
};

export const uppercaseInput: React.CSSProperties = {
    textTransform: "uppercase",
};

export const joinErrorMessage: React.CSSProperties = {
    color: "red",
    marginTop: "1em",
    textAlign: "center",
};
