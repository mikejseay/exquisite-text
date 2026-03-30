import KeyboardIcon from "@mui/icons-material/Keyboard";
import IconButton from "@mui/material/IconButton";
import LeaveButton from "components/LeaveButton/LeaveButton";
import MultipleDrawings from "components/MultipleDrawings/MultipleDrawings";
import MultiplePoems from "components/MultiplePoems/MultiplePoems";
import { useSocketInfo } from "context/SocketInfoProvider";
import {
    emitCreateRoomAndHost,
    emitRecognizeDevice,
    emitRequestDrawings,
    emitRequestPoemsLines,
    emitRequestUserTableInfo,
} from "context/SocketRequestors";
import * as React from "react";
import { centered, floatingToggleAnimate } from "screens/End/styles";
import { Medium } from "types/types";

function End({ testingMedium }: { testingMedium?: Medium }) {
    const { medium } = useSocketInfo();

    const [rendered, setRendered] = React.useState(false);
    if (testingMedium && !rendered) {
        if (testingMedium === Medium.ART) {
            throw new Error("Passed Medium.ART into testing route");
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

    const [shouldAnimate, setShouldAnimate] = React.useState(false);
    const handleChange = () => {
        setShouldAnimate(!shouldAnimate);
    };

    const msgRef = React.useRef<HTMLSpanElement>(null);
    const [drawingTopOffset, setDrawingTopOffset] = React.useState(80);
    React.useEffect(() => {
        const span = msgRef.current;
        if (!span) return;
        const update = () => {
            const { height } = span.getBoundingClientRect();
            const mb = parseFloat(window.getComputedStyle(span).marginBottom);
            // +24 accounts for the drawing title div rendered above each canvas
            setDrawingTopOffset(height + mb + 24);
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(span);
        return () => observer.disconnect();
    }, []);

    const MultipleDrawingsAtEnd = () => {
        const { completedDrawings } = useSocketInfo();
        return (
            <MultipleDrawings
                completedDrawings={completedDrawings}
                shouldAnimate={shouldAnimate}
                topOffset={drawingTopOffset}
            />
        );
    };

    const displayedCompletedArt =
        medium === Medium.POETRY ? <MultiplePoems shouldAnimate={shouldAnimate} /> : MultipleDrawingsAtEnd();

    return (
        <div style={centered}>
            <LeaveButton />
            {medium === Medium.POETRY && (
                <IconButton onClick={handleChange} sx={floatingToggleAnimate}>
                    <KeyboardIcon color={shouldAnimate ? "primary" : "disabled"} />
                </IconButton>
            )}
            <span ref={msgRef} style={{ marginBottom: "0.5em" }}>
                Done! If you&apos;d like to play again, make a new room.
            </span>
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    width: "100%",
                    overflow: "auto",
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                {displayedCompletedArt}
            </div>
        </div>
    );
}

export default End;
