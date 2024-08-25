import * as React from "react";
import MultiplePoems from "../../components/MultiplePoems";
import { centered, floatingToggleAnimate } from "./styles";
import IconButton from "@mui/material/IconButton";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import {
    emitCreateRoomAndHost,
    emitRecognizeDevice,
    emitRequestPoemsLines,
    emitRequestUserTableInfo,
} from "../../context/SocketRequestors";
import { Medium } from "../../types";
import { useSocketInfo } from "../../context/SocketInfoProvider";
import CanvasSpectator from "../CanvasSpectator";

function End({ shouldTest = false }: { shouldTest: boolean }) {
    const { medium } = useSocketInfo();

    const [ rendered, setRendered ] = React.useState(false);
    if (shouldTest && !rendered) {
        emitRecognizeDevice();
        emitCreateRoomAndHost("ROOM", Medium.POETRY);
        emitRequestUserTableInfo(true);
        emitRequestPoemsLines(true);
        setRendered(true);
    }

    const [ shouldAnimate, setShouldAnimate ] = React.useState(true);
    const handleChange = () => {
        setShouldAnimate(!shouldAnimate);
    };

    const displayedCompletedArt = medium === Medium.POETRY
        ? <MultiplePoems shouldAnimate={shouldAnimate} />
        : <CanvasSpectator />;

    return (
        <div style={centered}>
            <IconButton onClick={handleChange} sx={floatingToggleAnimate}>
                <KeyboardIcon
                    color={
                        shouldAnimate
                            ? "primary"
                            : "disabled"
                    }
                />
            </IconButton>
            <span>Done! If you&apos;d like to play again, make a new room.</span>
            <br />
            {displayedCompletedArt}
        </div>
    );
}

export default End;
