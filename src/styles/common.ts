import * as React from "react";
import { SxProps } from "@mui/system";
import { FABDiameter, FABSpace } from "../constants";

export const textCentered: React.CSSProperties = {
    textAlign: "center",
};

export const centeredFlex: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
};

export const confirmBox: SxProps = {
    position: "absolute",
    zIndex: 3,
    border: "1px solid",
    p: 1,
    bgcolor: "background.paper",
    width: 170,
    marginRight: 0,
    marginLeft: "auto",
    fontFamily: "sans-serif",
};

export const leaveConfirmBox: SxProps = {
    ...confirmBox,
    top: FABDiameter,
    right: FABSpace * 2,
};

export const completeConfirmBox: SxProps = {
    ...confirmBox,
    top: FABDiameter + 2 * FABSpace,
    right: FABDiameter + 2 * FABSpace + 5,
};

export const estebanFont = "'Esteban', serif";
export const defaultFontSize = "18px";

export const poemTypography: React.CSSProperties = {
    fontFamily: estebanFont,
    fontSize: defaultFontSize,
};
