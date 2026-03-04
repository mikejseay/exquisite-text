import { SxProps } from "@mui/system";
import { FABDiameter, FABSpace } from "../../constants";

export const leaveConfirmBox: SxProps = {
    position: "absolute",
    top: FABDiameter,
    right: FABSpace * 2,
    zIndex: 3,
    border: "1px solid",
    p: 1,
    bgcolor: "background.paper",
    width: 170,
    marginRight: 0,
    marginLeft: "auto",
    fontFamily: "sans-serif",
};

export const leaveFAB: SxProps = {
    position: "fixed",
    right: FABSpace,
    top: FABSpace,
    zIndex: 11,
};
