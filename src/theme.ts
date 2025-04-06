import { Theme, createTheme } from "@mui/material/styles";

export const getTheme = (mode: "light" | "dark"): Theme =>
    createTheme({
        palette: {
            mode,
            ...(mode === "dark"
                ? {
                    background: {
                        default: "#121212",
                        paper: "#1e1e1e",
                    },
                }
                : {}),
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    contained:
            mode === "dark"
                ? {
                    backgroundColor: "#424242",
                    color: "#fff",
                    "&:hover": {
                        backgroundColor: "#616161",
                    },
                    // Ensure the entire button shows a pointer cursor
                    cursor: "pointer",
                }
                : {},
                },
            },
        },
    });
