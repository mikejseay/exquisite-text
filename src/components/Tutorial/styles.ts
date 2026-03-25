import type { SxProps } from "@mui/system";
import { FABSpace } from "constants/constants";
import type * as React from "react";

export const tutorialButton: React.CSSProperties = {
    position: "absolute",
    right: FABSpace - 5,
    top: FABSpace - 5,
};

export const tutorial: SxProps = {
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: "24",
    left: "50%",
    maxWidth: "90%",
    p: "4",
    padding: "2em",
    position: "absolute",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: "65ch",
};

export const modalContent: React.CSSProperties = {
    fontSize: "16px",
    marginRight: "auto",
    whiteSpace: "pre-line",
};

export const modalTitle: React.CSSProperties = {
    alignItems: "center",
    display: "flex",
    fontSize: "17px",
    justifyContent: "space-between",
    textAlign: "center",
};

export const modalExampleGif: React.CSSProperties = {
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: "90%",
};
