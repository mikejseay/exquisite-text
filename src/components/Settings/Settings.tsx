import SettingsIcon from "@mui/icons-material/Settings";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import * as React from "react";

function Settings() {
    const [anchorEl, setAnchorEl] = React.useState<Element | null>(null);
    const handleClick = (event: { currentTarget: React.SetStateAction<Element | null> }) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    const isOpen = Boolean(anchorEl);
    const id = isOpen ? "simple-popover" : undefined;

    return (
        <div className={"settings"}>
            <IconButton aria-label="settings" onClick={handleClick} size={"large"}>
                <SettingsIcon />
            </IconButton>
            <Popover
                anchorEl={anchorEl}
                anchorOrigin={{
                    horizontal: "left",
                    vertical: "bottom",
                }}
                id={id}
                onClose={handleClose}
                open={isOpen}
            >
                Nothing yet :)
            </Popover>
        </div>
    );
}

export default Settings;
