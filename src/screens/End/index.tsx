import * as React from "react";
import MultiplePoems from "../../components/MultiplePoems";
import { centered, floatingToggleAnimate } from "./styles";
import IconButton from "@mui/material/IconButton";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import {
    emitCreateRoomAndHost,
    emitRecognizeDevice,
    emitRequestDrawings,
    emitRequestPoemsLines,
    emitRequestUserTableInfo,
} from "../../context/SocketRequestors";
import { Medium } from "../../types";
import { useSocketInfo } from "../../context/SocketInfoProvider";
import MultipleDrawings from "../../components/MultipleDrawings";

function End({ testingMedium }: { testingMedium?: Medium }) {
    const { medium } = useSocketInfo();

    const [ rendered, setRendered ] = React.useState(false);
    if (testingMedium && !rendered) {
        if (testingMedium === Medium.ART) {
            throw new Error ("Passed Medium.ART into testing route");
        }
        emitRecognizeDevice();
        emitCreateRoomAndHost("ROOM", testingMedium);
        if (testingMedium === Medium.POETRY) {
            emitRequestUserTableInfo(true);
            emitRequestPoemsLines();
        } else if (testingMedium === Medium.DRAWING) {
            emitRequestDrawings();
        }
        setRendered(true);
    }

    const [ shouldAnimate, setShouldAnimate ] = React.useState(true);
    const handleChange = () => {
        setShouldAnimate(!shouldAnimate);
    };

    const displayedCompletedArt = medium === Medium.POETRY
        ? <MultiplePoems shouldAnimate={shouldAnimate} />
        : <MultipleDrawings shouldAnimate={false} />;

    return (
        <div style={centered}>
            {medium === Medium.POETRY && <IconButton onClick={handleChange} sx={floatingToggleAnimate}>
                <KeyboardIcon
                    color={
                        shouldAnimate
                            ? "primary"
                            : "disabled"
                    }
                />
            </IconButton>}
            <span>Done! If you&apos;d like to play again, make a new room.</span>
            <br />
            {displayedCompletedArt}
        </div>
    );
}

export default End;
