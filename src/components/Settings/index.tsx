import SettingsIcon from "@mui/icons-material/Settings";
import IconButton from "@mui/material/IconButton";

const Settings = () => {
  return (
    <div className={"settings"}>
      <IconButton aria-label="settings" size={"large"}>
        <SettingsIcon />
      </IconButton>
    </div>
  );
};

export default Settings;
