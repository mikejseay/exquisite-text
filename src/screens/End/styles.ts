import type { SxProps } from "@mui/system";
import { FABDiameter, FABSpace } from "constants/constants";
import type * as React from "react";
import { centeredFlex } from "styles/common";

export const centered: React.CSSProperties = {
    ...centeredFlex,
    height: "100%",
    minHeight: 0,
    overflow: "hidden",
};

export const floatingToggleAnimate: SxProps = {
    position: "fixed",
    right: FABDiameter + 2 * FABSpace + 5,
    top: FABSpace,
    zIndex: 11,
};
