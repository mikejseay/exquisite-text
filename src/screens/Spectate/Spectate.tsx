import LeaveButton from "components/LeaveButton/LeaveButton";
import Lines from "components/Lines/Lines";
import { useSocketInfo } from "context/SocketInfoProvider";
import * as React from "react";
import CanvasSpectator from "screens/CanvasSpectator/CanvasSpectator";
import { Medium } from "types/types";

function Spectate() {
    const { medium } = useSocketInfo();
    const [view, setView] = React.useState<JSX.Element | null>(null);

    React.useEffect(() => {
        if (medium === Medium.DRAWING || medium === Medium.ART) {
            setView(<CanvasSpectator />);
        } else if (medium === Medium.POETRY) {
            setView(<Lines />);
        } else {
            setView(null);
        }
    }, [medium]);

    return (
        <div>
            {view || <div>Loading spectator view…</div>}
            <LeaveButton />
        </div>
    );
}

export default Spectate;
