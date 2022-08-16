/* eslint-disable sort-keys */
import Button from "@mui/material/Button";
import Fab from "@mui/material/Fab";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import isNil from "lodash/isNil";
import * as React from "react";

import { useSocket } from "../App";
import "./LineInput.css";
import {
    activeInput,
    caret,
    errorMessage,
    helpMessageStyle,
    inactiveInput,
    inputBox,
    lineInputContainer,
    mainInputContainer,
    passButton,
    poemInputStyle,
    spacingSpan,
    textSpacer,
    underlineSpan,
    underlineSpanHover,
    underlineSuggestionDiv,
} from "./styles";

import {
    IGameSettingsInfo,
    LineLength,
} from "../../types";
import WarningIcon from "@mui/icons-material/Warning";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { ClickAwayListener } from "@mui/material";
import { SxProps } from "@mui/system";

// if activeEditor, the letters are visible and textarea is editable
// if inactiveEditor, the letters are invisible, and textarea is not editable
// if spectator, the letters are visible, but the textarea is not editable

// this function allows us to get the most current value of a state variable
// with the third output argument "ref"
// https://stackoverflow.com/questions/53845595/wrong-react-hooks-behaviour-with-event-listener
function useStateRef(initialValue: boolean) {
    const [ value, setValue ] = React.useState(initialValue);
    const ref = React.useRef(value);

    React.useEffect(() => {
        ref.current = value;
    }, [ value ]);

    return [ value, setValue, ref ] as const;
}

export interface ILineConstraints {
  minCharsOnLineOne: number;
  maxCharsOnLineOne: number;
  minCharsOnLineTwo: number;
  maxCharsOnLineTwo: number;
  idealCharsOnLineOne: number;
  idealCharsOnLineTwo: number;
}

export type ILineConstraintDict = {
  [key in LineLength]: ILineConstraints;
}

const lineConstraints: ILineConstraintDict = {
    long: {
        minCharsOnLineOne: 30,
        maxCharsOnLineOne: 70,
        minCharsOnLineTwo: 18,
        maxCharsOnLineTwo: 36,
        idealCharsOnLineOne: 60,
        idealCharsOnLineTwo: 30,
    },
    short: {
        minCharsOnLineOne: 20,
        maxCharsOnLineOne: 50,
        minCharsOnLineTwo: 12,
        maxCharsOnLineTwo: 24,
        idealCharsOnLineOne: 40,
        idealCharsOnLineTwo: 20,
    },
};

const LineInput = () => {
    const { socket } = useSocket();

    const handleLeave = () => {
        socket.emit("leave");
    };
    const [ open, setOpen ] = React.useState(false);
    const handleClick = () => {
        setOpen((prev) => !prev);
    };
    const handleClickAway = () => {
        setOpen(false);
    };
    const styles: SxProps = {
        position: "absolute",
        top: 80,
        right: "calc(50vw - 40ch - 10px)",
        zIndex: 1,
        border: "1px solid",
        p: 1,
        bgcolor: "background.paper",
        width: 170,
        marginRight: 0,
        marginLeft: "auto",
        fontFamily: "sans-serif",
    };

    const [ lineLength, setLineLength ] = React.useState<LineLength>(LineLength.short);
    const [ minCharsOnLineOne, setMinCharsOnLineOne ] = React.useState<number>(lineConstraints[LineLength.short]["minCharsOnLineOne"]);
    const [ maxCharsOnLineOne, setMaxCharsOnLineOne ] = React.useState<number>(lineConstraints[LineLength.short]["maxCharsOnLineOne"]);
    const [ minCharsOnLineTwo, setMinCharsOnLineTwo ] = React.useState<number>(lineConstraints[LineLength.short]["minCharsOnLineTwo"]);
    const [ maxCharsOnLineTwo, setMaxCharsOnLineTwo ] = React.useState<number>(lineConstraints[LineLength.short]["maxCharsOnLineTwo"]);
    const [ idealCharsOnLineOne, setIdealCharsOnLineOne ] = React.useState<number>(lineConstraints[LineLength.short]["idealCharsOnLineOne"]);
    const [ idealCharsOnLineTwo, setIdealCharsOnLineTwo ] = React.useState<number>(lineConstraints[LineLength.short]["idealCharsOnLineTwo"]);

    const lineSepString = "\n";

    const [ poemInput, setPoemInput ] = React.useState<string>("");
    const [ poemInputSpectate, setPoemInputSpectate ] = React.useState<string>("");

    const [ passEnabled, setPassEnabled, passEnabledRef ] = useStateRef(false);
    const [ onSecondLine, setOnSecondLine ] = React.useState<boolean>(false);

    const [ onLastLine, setOnLastLine ] = React.useState<boolean>(false);
    const [ lineInputVisible, setLineInputVisible ] = React.useState<boolean>(true);
    const [ poemDoneVisible, setPoemDoneVisible ] = React.useState<boolean>(true);

    const [ helpMessage, setHelpMessage ] = React.useState<string>("");
    const [ inputErrorMsg, setInputErrorMsg ] = React.useState<string>(lineSepString);
    const textareaRef = React.useRef() as React.MutableRefObject<HTMLTextAreaElement | null>;

    React.useEffect(() => {
        const lineEditListener = (lineEdit: string) => {
            setPoemInput(lineEdit);
        };

        const lineEditorWatchListener = (lineEditorWatchVal: string) => {
            setPoemInputSpectate(lineEditorWatchVal);
        };

        const lastLineListener = (lastLine: boolean) => {
            setOnLastLine(lastLine);
            if (lastLine) {
                setMaxCharsOnLineTwo(lineConstraints[lineLength]["maxCharsOnLineOne"]);
                setIdealCharsOnLineTwo(lineConstraints[lineLength]["idealCharsOnLineOne"]);
            } else {
                setMaxCharsOnLineTwo(lineConstraints[lineLength]["maxCharsOnLineTwo"]);
                setIdealCharsOnLineTwo(lineConstraints[lineLength]["idealCharsOnLineTwo"]);
            }
        };

        const editorActiveListener = (editorActiveFromServer: boolean) => {
            if (editorActiveFromServer) {
                setLineInputVisible(true);
                setHelpMessage("Complete a line of poetry.");
                setPoemDoneVisible(true);
            } else {
                setLineInputVisible(false);
                setHelpMessage("Your friend is writing 👇");
                setPassEnabled(false);
                setPoemDoneVisible(false);
            }
        };

        // Event handlers for the line and the deleteLine events are set up for the Socket.IO connection.
        const gameSettingsInfoListener = (info: IGameSettingsInfo) => {
            console.log("gameSettingsInfoListener", info);
            const length = info["lineLength"];
            setLineLength(length);
            setMinCharsOnLineOne(lineConstraints[length]["minCharsOnLineOne"]);
            setMaxCharsOnLineOne(lineConstraints[length]["maxCharsOnLineOne"]);
            setMinCharsOnLineTwo(lineConstraints[length]["minCharsOnLineTwo"]);
            setMaxCharsOnLineTwo(lineConstraints[length]["maxCharsOnLineTwo"]);
            setIdealCharsOnLineOne(lineConstraints[length]["idealCharsOnLineOne"]);
            setIdealCharsOnLineTwo(lineConstraints[length]["idealCharsOnLineTwo"]);
        };

        // set up listeners
        socket.on("lineEdit", lineEditListener);
        socket.on("lineEditorWatch", lineEditorWatchListener);
        socket.on("editorActive", editorActiveListener);
        socket.on("lastLine", lastLineListener);
        socket.on("gameSettingsInfo", gameSettingsInfoListener);

        // request initial populate on page load
        socket.emit("getLineEdit");
        socket.emit("getEditorActive");
        socket.emit("getGameSettingsInfo");  // initial populate
        socket.emit("getLastLineStatus");

        return () => {
            socket.off("lineEdit", lineEditListener);
            socket.off("editorActive", editorActiveListener);
            socket.off("gameSettingsInfo", gameSettingsInfoListener);
        };
    }, [
        lineLength,
        setPassEnabled,
        socket,
    ]);

    function helpBasedOnProgress(messageType: number, progressProp: number) {
        if (messageType === 1) {
            if (progressProp < 0.3) {
                setHelpMessage("Write a line of poetry.");
            } else if (progressProp < 0.75) {
                setHelpMessage("That's it, keep going!");
            } else {
                setHelpMessage("Go to next line when ready ⏎");
            }
        } else {
            if (progressProp < 0.6) {
                if (onLastLine) {
                    setHelpMessage("Last line. Make it count!");
                } else {
                    setHelpMessage("Now start the next line (Next player will see this.)");
                }
            } else {
                if (onLastLine) {
                    setHelpMessage("Perfect. Finish the poem!");
                } else {
                    setHelpMessage("Perfect. Pass the turn!");
                }
            }
        }
    }

    function sendNotification(msg: React.SetStateAction<string>) {
        setInputErrorMsg(msg);
        setTimeout(() => setInputErrorMsg(lineSepString), 3000);
    }

    // handles any change to the textarea element. written to be as fast as possible, so a bit verbose
    function handlePoemBodyChange(evt: { preventDefault: () => void; target: { value: string }; }) {
        evt.preventDefault();

        const lines = String(evt.target.value).split(lineSepString);

        if (lines.length === 1) {
            // only one line

            setOnSecondLine(false);

            if (lines[0].length > maxCharsOnLineOne) {
                const useInput = lines[0].slice(0, maxCharsOnLineOne);
                setPoemInput(useInput);
                socket.emit("lineEdit", useInput);
                sendNotification("First line maxed, press Enter/Return to go to next.");
                // setMessageType(1);
                // setProgress(useInput.length / s["idealCharsOnLineOne"]);
                helpBasedOnProgress(1, useInput.length / idealCharsOnLineOne);
                setPassEnabled(false);
            } else {
                setPoemInput(evt.target.value);
                socket.emit("lineEdit", evt.target.value);
                // setMessageType(1);
                // setProgress(evt.target.value.length / s["idealCharsOnLineOne"]);
                helpBasedOnProgress(1, evt.target.value.length / idealCharsOnLineOne);
                setPassEnabled(false);
            }

        } else if (lines.length === 2) {
            // two lines

            if (lines[1].length > maxCharsOnLineTwo) {
                // second line too long

                setOnSecondLine(true);

                const useInput =
          lines[0] + lineSepString + lines[1].slice(0, maxCharsOnLineTwo);
                setPoemInput(useInput);
                socket.emit("lineEdit", useInput);
                sendNotification("That's the max. When done, click pass.");
                // setMessageType(2);
                // setProgress(s["maxCharsOnLineTwo"] / s["idealCharsOnLineTwo"]);
                helpBasedOnProgress(2, maxCharsOnLineTwo / idealCharsOnLineTwo);
                setPassEnabled(true);
            } else if (lines[0].length < minCharsOnLineOne) {
                // first line too short

                setOnSecondLine(false);

                setPoemInput(lines[0]);
                socket.emit("lineEdit", lines[0]);
                sendNotification("More on first line!");
                // setMessageType(1);
                // setProgress(lines[0].length / s["idealCharsOnLineOne"]);
                helpBasedOnProgress(1, lines[0].length / idealCharsOnLineOne);
                setPassEnabled(false);
            } else {
                // just right!

                setOnSecondLine(true);

                setPoemInput(evt.target.value);
                socket.emit("lineEdit", evt.target.value);
                // setMessageType(2);
                // setProgress(lines[1].length / s["idealCharsOnLineTwo"]);
                helpBasedOnProgress(2, lines[1].length / idealCharsOnLineTwo);
                setPassEnabled(
                    lines[1].length >= minCharsOnLineTwo &&
          lines[1].length <= maxCharsOnLineTwo,
                );
            }
        } else {
            // more than 2 lines somehow (e.g. large copy-paste or press enter on line two)

            setOnSecondLine(true);

            const useInput =
        lines[0] + lineSepString + lines[1].slice(0, maxCharsOnLineTwo);
            setPoemInput(useInput);
            socket.emit("lineEdit", useInput);
            const linesTwo = useInput.split(lineSepString);
            sendNotification("Two lines only. If done click Pass.");
            helpBasedOnProgress(2, linesTwo[1].length / idealCharsOnLineTwo);
            // setMessageType(2);
            // setProgress(s["maxCharsOnLineTwo"] / s["idealCharsOnLineTwo"]);
            setPassEnabled(
                linesTwo[1].length >= minCharsOnLineTwo &&
        linesTwo[1].length <= maxCharsOnLineTwo,
            );
        }
    }

    function passTurn() {
    // this function takes approximately 1.5 lines of poem, and "makes them exquisite" by clipping the 1st line.
    // the next person who sees the result should not be aware of the 1st line but must continue with a new line
        const poemParts = poemInput.split(lineSepString);

        // check user input, should be two lines, although access to even executing this function is regulated
        // by the passEnabledRef value, which enables and disables the button
        if (poemParts.length > 1) {
            const [ firstPart, secondPart ] = poemParts;

            // broadcast that there was a change
            setPoemInput(secondPart);
            setOnSecondLine(false);

            // this client submits its line, triggering a movement of its poem from its queue
            // to the target queue
            socket.emit("passTurn", firstPart, secondPart);

            // after this we will never be able to pass right away
            setPassEnabled(false);

            // after this, either we aren't editing any longer (normal) or if it's a solo game,
            // or if there are multiple poems in your queue, you could go directly back into editing
            // make sure the UI is set appropriately
        }
    }

    // since there is no separate "complete poem" button now,
    // maybe this button's functionality should change?
    function completePoem() {
    // post the current input to the lines
        socket.emit("lastLine", poemInput);

        // set the input textarea to be blank
        setPoemInput("");
        socket.emit("lineEdit", "");
        setOnSecondLine(false);

        setLineInputVisible(false);
        setPassEnabled(false);
        // setHelpMessage("Poem completed! Open it at the bottom of the page.\n" +
        //   "If you'd like to play again, make a new room.");
        setPoemDoneVisible(false);
    }

    function handleKeyDown({ charCode, key, ctrlKey, metaKey }: React.KeyboardEvent) {
    // it triggers by pressing macOS cmd + enter (13), when the "Done Line" button is enabled
    // might not be necessary, but it's kind of nice
    // note we use passEnabledRef instead of passEnabled because it gets the current value
        if (passEnabledRef.current && (ctrlKey || metaKey) && (key === "Enter" || charCode === 13)) {
            if (onLastLine) {
                completePoem();
            } else {
                passTurn();
            }
        }
    }

    return (
    // the initial idea here was to have a single textarea element that was editable
    // an alternative idea is to have this element be composed of a non-editable portion
    // and an editable portion
        <div className={"line-input-container"} style={lineInputContainer}>
            <div
                className={"main-input-container"}
                style={mainInputContainer}
            >
                <div
                    className={"help-message"}
                    style={helpMessageStyle}
                >
                    {helpMessage}
                </div>
                <div
                    className={"error-message"}
                    style={errorMessage}
                >
                    {inputErrorMsg}
                </div>
                <div
                    className={"input-box"}
                    style={inputBox}
                >
                    {lineInputVisible
                        ?
                        (
                            <div
                                className={"active-input"}
                                style={activeInput}
                                onMouseOver={() => {
                                    const target = document.getElementById("hoverSensitiveSpan") as HTMLElement;
                                    if (!isNil(underlineSpanHover.borderBottom)) {
                                        target.style.borderBottom = underlineSpanHover.borderBottom as string;
                                    }
                                }}
                                onMouseOut={() => {
                                    const target = document.getElementById("hoverSensitiveSpan") as HTMLElement;
                                    if (!isNil(underlineSpan.borderBottom)) {
                                        target.style.borderBottom = underlineSpan.borderBottom as string;
                                    }
                                }}
                            >
                                <div
                                    className={"underline-suggestion"}
                                    style={underlineSuggestionDiv}
                                >
                                    <span
                                        id={"hoverSensitiveSpan"}
                                        style={underlineSpan}
                                    >
                                        {onSecondLine
                                            ? (
                                                "  ".repeat(idealCharsOnLineOne + 3) + "\n" + "  ".repeat(idealCharsOnLineTwo + 3)
                                            )
                                            : (
                                                "  ".repeat(idealCharsOnLineOne + 3)
                                            )}
                                    </span>
                                </div>
                                <textarea
                                    className={"poem-input"}
                                    ref={textareaRef}
                                    value={poemInput}
                                    style={poemInputStyle}
                                    onChange={handlePoemBodyChange}
                                    // onKeyPress={handleKeypress}
                                    onKeyDown={handleKeyDown}
                                    rows={2}
                                    autoFocus={true}
                                    readOnly={false}
                                    onFocus={() =>
                                        !isNil(textareaRef) && !isNil(textareaRef.current)
                                            ? textareaRef.current.setSelectionRange(-1, -1)
                                            : {}
                                    }
                                > </textarea>
                            </div>
                        ) :
                        (
                            <div
                                className={"inactive-input"}
                                style={inactiveInput}
                            >
                                <div
                                    className={"text-spacer"}
                                    data-autofocus={true}
                                    style={textSpacer}
                                >
                                    <span
                                        style={spacingSpan}
                                    >
                                        {poemInputSpectate.replaceAll(/[^\n]/g, "*")}
                                    </span>
                                    <div
                                        id="caret"
                                        style={caret}
                                    > </div>
                                </div>
                            </div>
                        )}
                </div>
                <div className={"pass-button-container"}>
                    <div
                        className={"pass-button"}
                        style={passButton}
                    >
                        <Button
                            variant={"contained"}
                            onClick={onLastLine
                                ? completePoem
                                : passTurn}
                            disabled={!passEnabled}
                        >
                            {onLastLine
                                ? "Complete Poem"
                                : "Pass"}
                        </Button>
                    </div>
                </div>
                <ClickAwayListener onClickAway={handleClickAway}>
                    <Box>
                        <Fab
                            size="small"
                            color="primary"
                            aria-label="complete"
                            sx={{ position: "absolute", right: "calc(50vw - 40ch - 10px)", top: "20px" }}
                            onClick={handleClick}
                            disabled={!poemDoneVisible}
                        >
                            <PlaylistAddCheckIcon />
                        </Fab>
                        {open
                            ? (
                                <Box sx={styles}>
                                    <p style={{ margin: "0 0 0.5em 0" }}><WarningIcon />
                                        Want to complete the poem early?</p>
                                    <Stack spacing={2} direction="row" style={{ justifyContent: "center" }}>
                                        <Button variant="outlined" onClick={handleClickAway}>No</Button>
                                        <Button variant="contained" onClick={completePoem}>Yes</Button>
                                    </Stack>
                                </Box>
                            )
                            : null}
                    </Box>
                </ClickAwayListener>
            </div>
        </div>
    );
};

export default LineInput;
