import * as React from "react";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import FAB from "@mui/material/Button";
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
                <FAB
                    color="primary"
                    aria-label="library"
                    sx={libraryButton}
                    onClick={_clickHandler}
                >
                    <MenuBookIcon />
                </FAB>
            </Box>
        </div>
    );
}
