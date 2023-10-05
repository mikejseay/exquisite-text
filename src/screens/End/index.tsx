import * as React from "react";
import MultiplePoems from "../../components/MultiplePoems";
import { centered, floatingToggleAnimate } from "./styles";
import IconButton from "@mui/material/IconButton";
import KeyboardIcon from "@mui/icons-material/Keyboard";

function End({ shouldTest }: { shouldTest: boolean }) {
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
            <MultiplePoems shouldTest={shouldTest} shouldAnimate={shouldAnimate} />
        </div>
    );
}

export default End;
