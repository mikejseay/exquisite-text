import * as React from "react";
import { SxProps, Theme } from "@mui/system";

export const sketchContainer: React.CSSProperties = {
    boxSizing: "border-box",
    width: "100%",
    maxWidth: "1000px",
    padding: "20px",
};

export const controlsContainer: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
};

export const modelSelect: React.CSSProperties = {
    minWidth: "150px",
};

export const temperatureContainer: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginLeft: "auto",
};

export const temperatureSlider: React.CSSProperties = {
    width: "120px",
};

export const temperatureLabel: React.CSSProperties = {
    fontWeight: "bold",
    minWidth: "40px",
};

export const canvasContainer: React.CSSProperties = {
    marginTop: "8px",
    border: "3px solid black",
    backgroundColor: "#ffffff",
    touchAction: "none", // Prevent touch scrolling while drawing
};

export const buttonSx: SxProps<Theme> = {
    textTransform: "uppercase",
    fontWeight: 700,
    fontSize: "14px",
    padding: "4px 14px",
    border: "3px solid #222",
    backgroundColor: "white",
    color: "#222",
    "&:hover": {
        backgroundColor: "#6FC9C6",
        color: "white",
    },
};

export const selectSx: SxProps<Theme> = {
    minWidth: "150px",
    "& .MuiSelect-select": {
        padding: "4px 14px",
    },
};

export const sliderSx: SxProps<Theme> = {
    width: "120px",
    color: "#222",
};

export const loadingOverlay: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    zIndex: 10,
};

export const canvasWrapper: React.CSSProperties = {
    position: "relative",
};
