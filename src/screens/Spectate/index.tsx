import * as React from "react";
import Lines from "../../components/Lines";
import LeaveButton from "../../components/LeaveButton";
import { useSocketInfo } from "../../context/SocketInfoProvider";
import { Medium } from "../../types";
import CanvasSpectator from "../CanvasSpectator";

function Spectate() {
    const { medium } = useSocketInfo();
    const [ view, setView ] = React.useState<JSX.Element | null>(null);

    React.useEffect(() => {
        if (medium === Medium.DRAWING || medium === Medium.ART) {
            setView(<CanvasSpectator />);
        } else if (medium === Medium.POETRY) {
            setView(<Lines />);
        } else {
            setView(null);
        }
    }, [ medium ]);

    return (
        <div>
            {view || <div>Loading spectator view…</div>}
            <LeaveButton />
        </div>
    );
}

export default Spectate;
