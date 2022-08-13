import Snackbar from "@mui/material/Snackbar";
import * as React from "react";

import { useSocket } from "../App";

import type { IUserInfo } from "../../types";

const GameSnack = () => {
    const { socket } = useSocket();

    const [ snackMessage, setSnackMessage ] = React.useState("");
    const [ snackOpen, setSnackOpen ] = React.useState(false);
    const handleClose = () => { setSnackOpen(false); };

    React.useEffect(() => {
        function userInfoListener(userInfo: IUserInfo) {
            if (userInfo["role"] === "activeEditor") {
                document.title = "Your turn!";
                setTimeout(() => (document.title = "Exquisite Text"), 3000);
                snackBasedOnTurnsAway(userInfo["turnsAway"]);
                setSnackOpen(true);
                setTimeout(() => setSnackOpen(false), 3000);
            } else if (userInfo["role"] === "inactiveEditor") {
                snackBasedOnTurnsAway(userInfo["turnsAway"]);
                setSnackOpen(true);
                setTimeout(() => setSnackOpen(false), 3000);
            }
        }

        // socket.on("userInfo", userInfoListener);

        return () => {
            // socket.off("userInfo", userInfoListener);
        };
    }, [ socket ]);

    function snackBasedOnTurnsAway(turnsAway: IUserInfo["turnsAway"]) {
        if (turnsAway === 0) {
            setSnackMessage("It's your turn!");
        } else if (turnsAway === 1) {
            setSnackMessage("You go next!");
        } else if (turnsAway === undefined) {
            setSnackMessage("You spectate something exquisite");
        } else {
            setSnackMessage("You're up in " + turnsAway.toString() + " turns.");
        }
    }

    return (
        <Snackbar
            anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
            open={snackOpen}
            onClose={handleClose}
            message={snackMessage}
        />
    );
};

export default GameSnack;
