import * as React from "react";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import { libraryButton } from "./styles";
import { useNavigate } from "react-router-dom";

export function LibraryButton(): JSX.Element {
    const navigate = useNavigate();

    function _clickHandler(): void {
        if (location && location.pathname === "/library") {
            return;
        }
        navigate("library");
    }

    return (
        <div className={"goto-library"}>
            <Box>
                <IconButton
                    color="primary"
                    size={"large"}
                    aria-label="library"
                    sx={libraryButton}
                    onClick={_clickHandler}
                >
                    <MenuBookIcon />
                </IconButton>
            </Box>
        </div>
    );
}
