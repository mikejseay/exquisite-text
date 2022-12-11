import { SxProps } from "@mui/system";
import { FABDiameter, FABSpace } from "../../constants";

export const hostConfirmBox: SxProps = {
    position: "absolute",
    top: FABDiameter + 2 * FABSpace,
    left: FABDiameter + 2 * FABSpace - 5,  // because the FAB center is slightly off
    zIndex: 3,
    border: "1px solid",
    p: 1,
    bgcolor: "background.paper",
    width: 170,
    marginRight: 0,
    marginLeft: "auto",
    fontFamily: "sans-serif",
};

export const hostFAB: SxProps = {
    position: "absolute",
    left: FABDiameter + 2 * FABSpace - 5,
    top: FABSpace,
};

export const roomCodeStyles: React.CSSProperties = {
    paddingLeft: "2em",
    position: "absolute",
    top: FABDiameter + 2 * FABSpace,
};
