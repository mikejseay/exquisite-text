import { SxProps } from "@mui/system";
import {
    FABDiameter,
    FABSpace,
} from "../../constants";

export const libraryButton: SxProps = {
    position: "absolute",
    left: FABDiameter + 2 * FABSpace - 25,
    top: FABSpace,
};