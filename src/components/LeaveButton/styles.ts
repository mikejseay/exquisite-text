import { SxProps } from "@mui/system";
import { FABSpace } from "constants/constants";
import { leaveConfirmBox } from "styles/common";

export { leaveConfirmBox };

export const leaveFAB: SxProps = {
    position: "fixed",
    right: FABSpace,
    top: FABSpace,
    zIndex: 11,
};
