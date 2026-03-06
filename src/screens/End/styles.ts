import * as React from "react";
import { SxProps } from "@mui/system";
import { FABDiameter, FABSpace } from "../../constants";

export const centered: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
};

export const floatingToggleAnimate: SxProps = {
    position: "fixed",
    right: FABDiameter + 2 * FABSpace + 5,
    top: FABSpace,
    zIndex: 11,
};
