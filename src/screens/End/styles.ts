import { SxProps } from "@mui/system";
import { FABDiameter, FABSpace } from "../../constants";
import { centeredFlex } from "../../styles/common";

export { centeredFlex as centered };

export const floatingToggleAnimate: SxProps = {
    position: "fixed",
    right: FABDiameter + 2 * FABSpace + 5,
    top: FABSpace,
    zIndex: 11,
};
