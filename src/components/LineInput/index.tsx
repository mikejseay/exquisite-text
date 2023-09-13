import * as React from "react";
import isNil from "lodash/isNil";
import Button from "@mui/material/Button";
import Fab from "@mui/material/Fab";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { ClickAwayListener, Fade } from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";

import { useSocket } from "../App";
import {
    IGameSettingsInfo,
    LineLength,
} from "../../types";
import {
    lineConstraints,
    lineSepString,
} from "../../constants";
import { shortDur } from "../../constants";
import { useStateRef } from "../../helpers";
import {
    activeInput,
    alertMessageStyle,
    caret,
    completeConfirmBox,
    completeFAB,
    inactiveInput,
    inputBox,
    lineInputContainer,
    mainInputContainer,
    passButton,
    poemInputStyle,
    spacingSpan,
    textSpacer,
    underlineSpan,
    underlineSuggestionDiv,
} from "./styles";
import "./LineInput.css";

const LineInput = () => {
    const { socket } = useSocket();
    const [ open, setOpen ] = React.useState(false);
    const handleClick = () => {
        setOpen((prev) => !prev);
    };
    const handleClickAway = () => {
        setOpen(false);
    };

    const [ lineLength, setLineLength ] = React.useState<LineLength>(LineLength.short);
    const [ minCharsOnLineOne, setMinCharsOnLineOne ] = React.useState<number>(lineConstraints[LineLength.short]["minCharsOnLineOne"]);
    const [ maxCharsOnLineOne, setMaxCharsOnLineOne ] = React.useState<number>(lineConstraints[LineLength.short]["maxCharsOnLineOne"]);
    const [ minCharsOnLineTwo, setMinCharsOnLineTwo ] = React.useState<number>(lineConstraints[LineLength.short]["minCharsOnLineTwo"]);
    const [ maxCharsOnLineTwo, setMaxCharsOnLineTwo ] = React.useState<number>(lineConstraints[LineLength.short]["maxCharsOnLineTwo"]);
    const [ idealCharsOnLineOne, setIdealCharsOnLineOne ] = React.useState<number>(lineConstraints[LineLength.short]["idealCharsOnLineOne"]);
    const [ idealCharsOnLineTwo, setIdealCharsOnLineTwo ] = React.useState<number>(lineConstraints[LineLength.short]["idealCharsOnLineTwo"]);

    const [ poemInput, setPoemInput ] = React.useState<string>("");
    const [ poemInputSpectate, setPoemInputSpectate ] = React.useState<string>("");

    const [ passEnabled, setPassEnabled, passEnabledRef ] = useStateRef(false);
    const [ displaySecondLine, setDisplaySecondLine ] = React.useState<boolean>(false);

    const [ onLastLine, setOnLastLine ] = React.useState<boolean>(false);
    const [ textAreaVisible, setTextAreaVisible ] = React.useState<boolean>(true);
    const [ poemDoneVisible, setPoemDoneVisible ] = React.useState<boolean>(true);

    const [ helpMessage, setHelpMessage ] = React.useState<string>("");
    const [ inputErrorMsg, setInputErrorMsg ] = React.useState<string>(lineSepString);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // places the text cursor at the end of the current content of the textarea when it becomes visible
    React.useEffect(() => {
        if (textAreaVisible) {
            if (!isNil(textareaRef) && !isNil(textareaRef.current)) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(-1, -1);
            }
        }
    }, [ textAreaVisible ]);

    React.useEffect(() => {
        const lineEditListener = (lineEdit: string) => {
            setPoemInput(lineEdit);
        };

        const lineEditorWatchListener = (lineEditorWatchVal: string) => {
            setPoemInputSpectate(lineEditorWatchVal);
        };

        const lastLineListener = (lastLine: boolean) => {
            setOnLastLine(lastLine);
            const constraints = lineConstraints[lineLength];
            if (lastLine) {
                setMaxCharsOnLineTwo(constraints.maxCharsOnLineOne);
                setIdealCharsOnLineTwo(constraints.idealCharsOnLineOne);
            } else {
                setMaxCharsOnLineTwo(constraints.maxCharsOnLineTwo);
                setIdealCharsOnLineTwo(constraints.idealCharsOnLineTwo);
            }
        };

        const editorActiveListener = (editorActiveFromServer: boolean) => {
            setDisplaySecondLine(false);
            if (editorActiveFromServer) {
                setTextAreaVisible(true);
                setHelpMessage("Complete a line of poetry.");
                setPoemDoneVisible(true);
            } else {
                setTextAreaVisible(false);
                setHelpMessage("Your friend is writing ⤵");
                setPassEnabled(false);
                setPoemDoneVisible(false);
            }
        };

        // Event handlers for the line and the deleteLine events are set up for the Socket.IO connection.
        const gameSettingsInfoListener = (info: IGameSettingsInfo) => {
            const useSettings = lineConstraints[info["lineLength"]];
            setLineLength(info["lineLength"]);
            setMinCharsOnLineOne(useSettings["minCharsOnLineOne"]);
            setMaxCharsOnLineOne(useSettings["maxCharsOnLineOne"]);
            setMinCharsOnLineTwo(useSettings["minCharsOnLineTwo"]);
            setMaxCharsOnLineTwo(useSettings["maxCharsOnLineTwo"]);
            setIdealCharsOnLineOne(useSettings["idealCharsOnLineOne"]);
            setIdealCharsOnLineTwo(useSettings["idealCharsOnLineTwo"]);
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
        socket.emit("getGameSettingsInfo");
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
                setDisplaySecondLine(false);
            } else if (progressProp < 0.75) {
                setHelpMessage("That's it, keep going!");
                setDisplaySecondLine(false);
            } else {
                setHelpMessage("Go to next line when ready ⏎");
                setDisplaySecondLine(true);
            }
        } else {
            setDisplaySecondLine(true);
            if (progressProp < 0.6) {
                if (onLastLine) {
                    setHelpMessage("Last line. Make it count!");
                } else {
                    setHelpMessage("Start the next line (Next player will see this.)");
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

    function displayError(msg: React.SetStateAction<string>) {
        setInputErrorMsg(msg);
        setTimeout(() => setInputErrorMsg(lineSepString), shortDur);
    }

    // handles any change to the textarea element. written to be as fast as possible, so a bit verbose
    function handlePoemBodyChange(evt: { preventDefault: () => void; target: { value: string }; }) {
        evt.preventDefault();

        const lines = String(evt.target.value).split(lineSepString);

        if (lines.length === 1) {
            // only one line

            if (lines[0].length > maxCharsOnLineOne) {
                const useInput = lines[0].slice(0, maxCharsOnLineOne);
                setPoemInput(useInput);
                socket.emit("lineEdit", useInput);
                displayError("First line maxed, press Enter/Return to go to next.");
                helpBasedOnProgress(1, useInput.length / idealCharsOnLineOne);
                setPassEnabled(false);
            } else {
                setPoemInput(evt.target.value);
                socket.emit("lineEdit", evt.target.value);
                helpBasedOnProgress(1, evt.target.value.length / idealCharsOnLineOne);
                setPassEnabled(false);
            }

        } else if (lines.length === 2) {
            // two lines

            if (lines[1].length > maxCharsOnLineTwo) {
                // second line too long

                const useInput = lines[0] + lineSepString + lines[1].slice(0, maxCharsOnLineTwo);
                setPoemInput(useInput);
                socket.emit("lineEdit", useInput);
                displayError("That's the max. When done, click pass.");
                helpBasedOnProgress(2, maxCharsOnLineTwo / idealCharsOnLineTwo);
                setPassEnabled(true);
            } else if (lines[0].length < minCharsOnLineOne) {
                // first line too short

                setPoemInput(lines[0]);
                socket.emit("lineEdit", lines[0]);
                displayError("More on first line!");
                helpBasedOnProgress(1, lines[0].length / idealCharsOnLineOne);
                setPassEnabled(false);
            } else {
                // just right!

                setPoemInput(evt.target.value);
                socket.emit("lineEdit", evt.target.value);
                helpBasedOnProgress(2, lines[1].length / idealCharsOnLineTwo);
                setPassEnabled(lines[1].length >= minCharsOnLineTwo && lines[1].length <= maxCharsOnLineTwo);
            }
        } else {
            // more than 2 lines somehow (e.g. large copy-paste or press enter on line two)

            const useInput = lines[0] + lineSepString + lines[1].slice(0, maxCharsOnLineTwo);
            setPoemInput(useInput);
            socket.emit("lineEdit", useInput);
            const linesTwo = useInput.split(lineSepString);
            displayError("Two lines only. If done click Pass.");
            helpBasedOnProgress(2, linesTwo[1].length / idealCharsOnLineTwo);
            setPassEnabled(linesTwo[1].length >= minCharsOnLineTwo && linesTwo[1].length <= maxCharsOnLineTwo);
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

        setTextAreaVisible(false);
        setPassEnabled(false);
        setPoemDoneVisible(false);
    }

    function handleKeyDown({ charCode, key, ctrlKey, metaKey }: React.KeyboardEvent) {
    // it triggers by pressing macOS cmd or ctrl + enter (13), when the "Done Line" button is enabled
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
        <div
            className={"line-input-container"}
            style={lineInputContainer}
        >
            <div
                className={"main-input-container"}
                style={mainInputContainer}
            >
                <div
                    className={"alert-message"}
                    style={alertMessageStyle}
                >
                    {inputErrorMsg !== "\n"
                        ? <Alert severity="error">{inputErrorMsg}</Alert>
                        : helpMessage !== "" && <Alert severity="info">{helpMessage}</Alert>}
                </div>
                <div
                    className={"input-box"}
                    style={inputBox}
                >
                    {textAreaVisible
                        ?
                        (
                            <div
                                className={"active-input"}
                                style={activeInput}
                            >
                                <div
                                    className={"underline-suggestion"}
                                    style={underlineSuggestionDiv}
                                >
                                    <span
                                        className={"underline-span-1"}
                                        style={underlineSpan}
                                    >
                                        {"  ".repeat(idealCharsOnLineOne + 3) + lineSepString}
                                    </span>
                                    <Fade in={displaySecondLine} timeout={1000}>
                                        <span
                                            className={"underline-span-2"}
                                            style={underlineSpan}
                                        >
                                            {"  ".repeat(idealCharsOnLineTwo + 3)}
                                        </span>
                                    </Fade>
                                </div>
                                <textarea
                                    autoFocus={true} // this only on initial page load
                                    className={"poem-input"}
                                    onChange={handlePoemBodyChange}
                                    onKeyDown={handleKeyDown}
                                    readOnly={false}
                                    ref={textareaRef}
                                    rows={2}
                                    style={poemInputStyle}
                                    value={poemInput}
                                />
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
                            aria-label="complete"
                            color="primary"
                            disabled={!poemDoneVisible}
                            onClick={handleClick}
                            size="small"
                            sx={completeFAB}
                        >
                            <PlaylistAddCheckIcon />
                        </Fab>
                        {open
                            ? (
                                <Box sx={completeConfirmBox}>
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
