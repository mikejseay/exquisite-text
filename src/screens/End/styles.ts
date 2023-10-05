import * as React from "react";
import { SxProps } from "@mui/system";
import { FABSpace } from "../../constants";

export const centered: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
};

export const floatingToggleAnimate: SxProps = {
    position: "absolute",
    right: 2 * FABSpace - 5,
    top: FABSpace,
};
