import * as React from "react";
import MultiplePoems from "../../components/MultiplePoems";
import { centered, floatingToggleAnimate } from "./styles";
import IconButton from "@mui/material/IconButton";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import {
    emitCreateGameHost,
    emitRecognizeDevice,
    emitRequestPoemsLines,
    emitRequestUserTableInfo,
} from "../../context/SocketRequestors";
import { Medium } from "../../types";

function End({ shouldTest = false }: { shouldTest: boolean }) {

    const [ rendered, setRendered ] = React.useState(false);
    if (shouldTest && !rendered) {
        emitRecognizeDevice();
        emitCreateGameHost(Medium.POETRY, "ROOM");
        emitRequestUserTableInfo(true);
        emitRequestPoemsLines(true);
        setRendered(true);
    }

    const [ shouldAnimate, setShouldAnimate ] = React.useState(true);
    const handleChange = () => {
        setShouldAnimate(!shouldAnimate);
    };
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
            <MultiplePoems shouldAnimate={shouldAnimate} />
        </div>
    );
}

export default End;
