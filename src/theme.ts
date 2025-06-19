import { Theme, createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    canvas: {
        background?: string;
        boxShadow?: string;
    };
}
interface PaletteOptions {
    canvas: {
        background?: string;
        boxShadow?: string;
    };
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
                    canvas: {
                        background: "rgb(0,0,0)",
                        boxShadow: "rgba(0,0,0,0.7)",
                    },
                }
                : {
                    canvas: {
                        background: "#fff",
                        boxShadow: "rgba(255,255,255,0.7)",
                    },
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
