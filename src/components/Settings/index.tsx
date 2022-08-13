import * as React from "react";
import Popover from "@mui/material/Popover";
import SettingsIcon from "@mui/icons-material/Settings";
import IconButton from "@mui/material/IconButton";
// import Leave from "../Leave";
// import { useSocket } from "../App";
// import Button from "@mui/material/Button";

function Settings() {
    const [ anchorEl, setAnchorEl ] = React.useState<Element | null>(null);
    const handleClick = (event: { currentTarget: React.SetStateAction<Element | null> }) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    const isOpen = Boolean(anchorEl);
    const id = isOpen
        ? "simple-popover"
        : undefined;

    // const { socket } = useSocket();
    //
    // const handleLeaveButton = () => {
    //     socket.emit("leave");
    // };

    return (
        <div className={"settings"}>
            <IconButton
                aria-label="settings"
                onClick={handleClick}
                size={"large"}
            >
                <SettingsIcon />
            </IconButton>
            <Popover
                id={id}
                open={isOpen}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    horizontal: "left",
                    vertical: "bottom",
                }}
            >
                {/*<Leave />*/}
                {/*<Button*/}
                {/*    onClick={handleLeaveButton}*/}
                {/*    variant="contained"*/}
                {/*>*/}
                {/*    Leave Game*/}
                {/*</Button>*/}
                Nothing yet :)
            </Popover>
        </div>
    );
}

export default Settings;
