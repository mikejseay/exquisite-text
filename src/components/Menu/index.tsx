import * as React from "react";
import { Link as RouterLink } from "react-router-dom";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import MenuIcon from "@mui/icons-material/Menu";

const Menu = () => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const handleDrawerOpen = () => setDrawerOpen(true);
  const handleDrawerClose = () => setDrawerOpen(false);

  return (
    <div className={"menu"}>
      <IconButton aria-label="menu" onClick={handleDrawerOpen} size={"large"}>
        <MenuIcon />
      </IconButton>
      <Drawer
        anchor={"left"}
        open={drawerOpen}
        onClose={handleDrawerClose}
      >
        <List>
          <ListItem key={"Create Game"} disablePadding>
            <ListItemButton component={RouterLink} to="host">
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>
              <ListItemText primary={"Create Game"} />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </div>
  );
};

export default Menu;
