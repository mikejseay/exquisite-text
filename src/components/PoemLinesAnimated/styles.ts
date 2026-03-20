import type { SxProps } from "@mui/system";
import type * as React from "react";

export const poemBody: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    marginLeft: "auto",
    marginRight: "auto",
    marginBottom: "10px",
};

export const copyButton: React.CSSProperties = {
    display: "flex",
    marginTop: "-2em",
};

export const colorKeyCard: React.CSSProperties = {
    marginTop: "auto",
    marginBottom: "1em",
};

export const colorKeyContent: SxProps = {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    padding: "0.4rem 0.5rem",
    "&:last-child": { paddingBottom: "0.4rem" },
};

export const colorKeyEntry: React.CSSProperties = {
    margin: "0.2rem 0.4rem",
    display: "flex",
    alignItems: "center",
};

export const colorKeyDot: React.CSSProperties = {
    fontSize: "0.75rem",
};

export const colorKeyName: React.CSSProperties = {
    marginLeft: "0.3rem",
    fontSize: "0.8rem",
};
