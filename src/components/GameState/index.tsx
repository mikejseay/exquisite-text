import * as React from "react";
import Popover from "@mui/material/Popover";
import PeopleIcon from "@mui/icons-material/People";
import IconButton from "@mui/material/IconButton";
import { marginLeftAuto } from "./styles";

function GameState() {
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
    <div style={marginLeftAuto}>
        <IconButton
          aria-label="players"
          onClick={handleClick}
          size={"large"}
        >
          <PeopleIcon />
        </IconButton>
      <Popover
        id={id}
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        There would be user info here once the user has:
        1) Created a game (host).
        2) Joined a game (writer or spectator).
      </Popover>
    </div>
  );
}

export default GameState;
