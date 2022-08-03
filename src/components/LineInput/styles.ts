import * as React from "react";

export const inputBox: React.CSSProperties = {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    marginBottom: "1em",
};

export const activeInput: React.CSSProperties = {
    margin: "auto",
    width: "100%",
    maxWidth: "60ch",
    display: "grid",
};

export const donePoemAccordionTitle: React.CSSProperties = {
    margin: "auto",
};

export const underlineSuggestionDiv: React.CSSProperties = {
    zIndex: 1,
    whiteSpace: "pre",
    gridRowStart: 1,
    gridColumnStart: 1,
    padding: "0",
    textAlign: "center",
    lineHeight: "150%",
    userSelect: "none",
};

export const underlineSpan: React.CSSProperties = {
    borderBottom: "2px #aaaaaa solid",
};

export const underlineSpanHover: React.CSSProperties = {
    // boxShadow: "0.1em 0.1em 0.6em grey",
    // boxShadow: "none",
    borderBottom: "4px #aaaaaa solid",
};

export const poemInputStyle: React.CSSProperties = {
    outline: "none",
    fontFamily: "'Esteban', serif",
    fontSize: "18px",
    textAlign: "center",
    resize: "none",
    lineHeight: "150%",
    cursor: "text",
    border: "none",
    // border: "1px #eeeeee solid",
    // backgroundImage: "linear-gradient(to right, #ffffff, #eeeeee)",
    // boxShadow: "0.1em 0.1em 0.5em #bbbbbb",
    boxShadow: "none",
    borderRadius: "0.75em",
    padding: "0",
    whiteSpace: "pre",
    width: "100%",
    maxWidth: "60ch",
    overflowX: "hidden",
    margin: "auto",
    display: "block",
    zIndex: 2,
    gridRowStart: 1,
    gridColumnStart: 1,
    background: "transparent",
};

export const spacingSpan: React.CSSProperties = {
    margin: "auto",
};

export const textSpacer: React.CSSProperties = {
    whiteSpace: "pre",
    color: "white",
    margin: "auto",
    width: "auto",
    textAlign: "center",
};

export const errorMessage: React.CSSProperties = {
    fontSize: "small",
    color: "red",
    whiteSpace: "pre-line",
    textAlign: "center",
};

export const passButton: React.CSSProperties = {
    minHeight: "40px",
    marginBottom: "1em",
};

export const helpMessageStyle: React.CSSProperties = {
    fontFamily: "sans-serif",
    whiteSpace: "pre-line",
    height: "1.2em",
};

export const donePoemButton: React.CSSProperties = {
    textAlign: "center",
};

export const donePoemAccordionText: React.CSSProperties = {
    marginBottom: "1em",
    fontFamily: "sans-serif",
};

export const lineInputContainer: React.CSSProperties = {
    marginTop: "2em",
    width: "100%",
};

export const mainInputContainer: React.CSSProperties = {
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    flexWrap: "nowrap",
    justifyContent: "space-between",
    alignItems: "center",
};

export const inactiveInput: React.CSSProperties = {
    marginTop: "1em",
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
};

export const caret: React.CSSProperties = {
    display: "inline-block",
    background: "black",
    height: "20px",
    width: "1px",
    animationDuration: "1s",
    animationName: "blink",
    animationIterationCount: "infinite",
};
