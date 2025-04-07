import { Theme, createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    canvasBackground?: string;
  }
  interface PaletteOptions {
    canvasBackground?: string;
  }
}

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
                    canvasBackground: "rgb(0,0,0)",
                }
                : {
                    canvasBackground: "#fff",
                }),
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
                    cursor: "pointer",
                }
                : {},
                },
            },
        },
    });
