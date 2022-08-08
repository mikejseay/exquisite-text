import * as React from "react";

export const inputBox: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    marginBottom: "1em",
    width: "100%",
};

export const activeInput: React.CSSProperties = {
    display: "grid",
    margin: "auto",
    maxWidth: "60ch",
    width: "100%",
};

export const donePoemAccordionTitle: React.CSSProperties = {
    margin: "auto",
};

export const underlineSuggestionDiv: React.CSSProperties = {
    gridColumnStart: 1,
    gridRowStart: 1,
    lineHeight: "150%",
    padding: "0",
    textAlign: "center",
    userSelect: "none",
    whiteSpace: "pre",
    zIndex: 1,
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
    // backgroundImage: "linear-gradient(to right, #ffffff, #eeeeee)",
    // border: "1px #eeeeee solid",
    // boxShadow: "0.1em 0.1em 0.5em #bbbbbb",
    background: "transparent",
    border: "none",
    borderRadius: "0.75em",
    boxShadow: "none",
    cursor: "text",
    display: "block",
    fontFamily: "'Esteban', serif",
    fontSize: "18px",
    gridColumnStart: 1,
    gridRowStart: 1,
    lineHeight: "150%",
    margin: "auto",
    maxWidth: "60ch",
    outline: "none",
    overflowX: "hidden",
    padding: "0",
    resize: "none",
    textAlign: "center",
    whiteSpace: "pre",
    width: "100%",
    zIndex: 2,
};

export const spacingSpan: React.CSSProperties = {
    margin: "auto",
};

export const textSpacer: React.CSSProperties = {
    color: "white",
    margin: "auto",
    textAlign: "center",
    whiteSpace: "pre",
    width: "auto",
};

export const errorMessage: React.CSSProperties = {
    color: "red",
    fontSize: "small",
    textAlign: "center",
    whiteSpace: "pre-line",
};

export const passButton: React.CSSProperties = {
    marginBottom: "1em",
    minHeight: "40px",
};

export const helpMessageStyle: React.CSSProperties = {
    fontFamily: "sans-serif",
    height: "1.2em",
    whiteSpace: "pre-line",
};

export const donePoemButton: React.CSSProperties = {
    textAlign: "center",
};

export const donePoemAccordionText: React.CSSProperties = {
    fontFamily: "sans-serif",
    marginBottom: "1em",
};

export const lineInputContainer: React.CSSProperties = {
    marginTop: "2em",
    width: "100%",
};

export const mainInputContainer: React.CSSProperties = {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    flexWrap: "nowrap",
    height: "100%",
    justifyContent: "space-between",
    width: "100%",
};

export const inactiveInput: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: "1em",
    width: "100%",
};

export const caret: React.CSSProperties = {
    animationDuration: "1s",
    animationIterationCount: "infinite",
    animationName: "blink",
    background: "black",
    display: "inline-block",
    height: "20px",
    width: "1px",
};
