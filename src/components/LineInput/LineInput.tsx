import * as React from "react";
import { isNil } from "es-toolkit";
import Button from "@mui/material/Button";
import Fab from "@mui/material/Fab";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { ClickAwayListener, Fade } from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";

import { logger } from "utilities/loggerUtils";
import { lineConstraints, lineSepString, shortDur } from "constants/constants";
import { useStateRef } from "helpers/helpers";
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
} from "components/LineInput/styles";
import "./LineInput.css";
import { useSocketInfo } from "context/SocketInfoProvider";
import { emitEditLine, emitSendLastLine, emitSendLineParts } from "context/SocketRequestors";

const LineInput = () => {
    const {
        poemInput,
        poemInputSpectate,
        onLastContribution,
        editorActive,
        setPoemInput,
        lineLength,
    } = useSocketInfo();
    if (
        poemInput === null ||
        poemInputSpectate === null ||
        onLastContribution === null ||
        editorActive === null ||
        lineLength === null
    ) {
        return null;
    }

    const useLineConstraints = lineConstraints[lineLength];
    const minCharsOnLineOne = useLineConstraints["minCharsOnLineOne"];
    const maxCharsOnLineOne = useLineConstraints["maxCharsOnLineOne"];
    const minCharsOnLineTwo = useLineConstraints["minCharsOnLineTwo"];
    const idealCharsOnLineOne = useLineConstraints["idealCharsOnLineOne"];

    const [ maxCharsOnLineTwo, setMaxCharsOnLineTwo ] = React.useState<number>(useLineConstraints["maxCharsOnLineTwo"]);
    const [ idealCharsOnLineTwo, setIdealCharsOnLineTwo ] = React.useState<number>(useLineConstraints["idealCharsOnLineTwo"]);

    // see lastLineListener and editorActiveListener
    React.useEffect(() => {
        if (onLastContribution) {
            setMaxCharsOnLineTwo(useLineConstraints.maxCharsOnLineOne);
            setIdealCharsOnLineTwo(useLineConstraints.idealCharsOnLineOne);
        } else {
            setMaxCharsOnLineTwo(useLineConstraints.maxCharsOnLineTwo);
            setIdealCharsOnLineTwo(useLineConstraints.idealCharsOnLineTwo);
        }
    }, [ onLastContribution ]);

    React.useEffect(() => {
        setShouldDisplaySecondLine(false);
        if (editorActive) {
            logger.debug("editor is being set to active");
            setTextAreaVisible(true);
            setHelpMessage("Complete a line of poetry.");
            setPoemDoneVisible(true);
        } else {
            setTextAreaVisible(false);
            setHelpMessage("Your friend is writing ⤵");
            setPassEnabled(false);
            setPoemDoneVisible(false);
        }
    }, [ editorActive ]);

    const [ completeEarlyBoxOpen, setCompleteEarlyBoxOpen ] = React.useState(false);
    const handleClick = () => {
        setCompleteEarlyBoxOpen((prev) => !prev);
    };
    const handleClickAway = () => {
        setCompleteEarlyBoxOpen(false);
    };

    const [ passEnabled, setPassEnabled, passEnabledRef ] = useStateRef(false);
    const [ shouldDisplaySecondLine, setShouldDisplaySecondLine ] = React.useState<boolean>(false);

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

    // auto-focus textarea when user presses a printable character key while not focused on it
    React.useEffect(() => {
        if (!textAreaVisible) return;

        function handleGlobalKeyDown(e: KeyboardEvent) {
            if (document.activeElement === textareaRef.current) return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.key.length === 1) {
                textareaRef.current?.focus();
            }
        }

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [ textAreaVisible ]);

    function helpBasedOnProgress(messageType: number, progressProp: number) {
        if (messageType === 1) {
            if (progressProp < 0.3) {
                setHelpMessage("Write a line of poetry.");
                setShouldDisplaySecondLine(false);
            } else if (progressProp < 0.75) {
                setHelpMessage("That's it, keep going!");
                setShouldDisplaySecondLine(false);
            } else {
                setHelpMessage("Go to next line when ready ⏎");
                setShouldDisplaySecondLine(true);
            }
        } else {
            setShouldDisplaySecondLine(true);
            if (progressProp < 0.6) {
                if (onLastContribution) {
                    setHelpMessage("Last line. Make it count!");
                } else {
                    setHelpMessage("Start the next line (Next player will see this.)");
                }
            } else {
                if (onLastContribution) {
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
    function handlePoemBodyChange(event: { preventDefault: () => void; target: { value: string }; }) {
        event.preventDefault();

        const lines = String(event.target.value).split(lineSepString);

        if (lines.length === 1) {
            // only one line

            if (lines[0].length > maxCharsOnLineOne) {
                const useInput = lines[0].slice(0, maxCharsOnLineOne);
                setPoemInput(useInput);
                emitEditLine(useInput);
                displayError("First line maxed, press Enter/Return to go to next.");
                helpBasedOnProgress(1, useInput.length / idealCharsOnLineOne);
                setPassEnabled(false);
            } else {
                setPoemInput(event.target.value);
                emitEditLine(event.target.value);
                helpBasedOnProgress(1, event.target.value.length / idealCharsOnLineOne);
                setPassEnabled(false);
            }

        } else if (lines.length === 2) {
            // two lines

            if (lines[1].length > maxCharsOnLineTwo) {
                // second line too long

                const useInput = lines[0] + lineSepString + lines[1].slice(0, maxCharsOnLineTwo);
                setPoemInput(useInput);
                emitEditLine(useInput);
                displayError("That's the max. When done, click pass.");
                helpBasedOnProgress(2, maxCharsOnLineTwo / idealCharsOnLineTwo);
                setPassEnabled(true);
            } else if (lines[0].length < minCharsOnLineOne) {
                // first line too short

                setPoemInput(lines[0]);
                emitEditLine(lines[0]);
                displayError("More on first line!");
                helpBasedOnProgress(1, lines[0].length / idealCharsOnLineOne);
                setPassEnabled(false);
            } else {
                // just right!

                setPoemInput(event.target.value);
                emitEditLine(event.target.value);
                helpBasedOnProgress(2, lines[1].length / idealCharsOnLineTwo);
                setPassEnabled(lines[1].length >= minCharsOnLineTwo && lines[1].length <= maxCharsOnLineTwo);
            }
        } else {
            // more than 2 lines somehow (e.g. large copy-paste or press enter on line two)

            const useInput = lines[0] + lineSepString + lines[1].slice(0, maxCharsOnLineTwo);
            setPoemInput(useInput);
            emitEditLine(useInput);
            const linesTwo = useInput.split(lineSepString);
            displayError("Two lines only. If done click Pass.");
            helpBasedOnProgress(2, linesTwo[1].length / idealCharsOnLineTwo);
            setPassEnabled(linesTwo[1].length >= minCharsOnLineTwo && linesTwo[1].length <= maxCharsOnLineTwo);
        }
    }

    function passTurn() {
    // this function takes approximately 1.5 lines of poem, and "makes them exquisite" by clipping the 1st line.
    // the next person who sees the result should not be aware of the 1st line but must continue with a new line

        if (!poemInput) {
            return;
        }

        const poemParts = poemInput.split(lineSepString);

        // check user input, should be two lines, although access to even executing this function is regulated
        // by the passEnabledRef value, which enables and disables the button
        if (poemParts.length > 1) {
            const [ firstPart, secondPart ] = poemParts;

            // broadcast that there was a change
            setPoemInput(secondPart);

            // this client submits its line, triggering a movement of its poem from its queue
            // to the target queue
            emitSendLineParts(firstPart, secondPart);

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

        setPoemDoneVisible(false);

        // post the current input to the lines
        if (poemInput !== null) {
            emitSendLastLine(poemInput);
        }
    }

    function handleKeyDown({ charCode, key, ctrlKey, metaKey }: React.KeyboardEvent) {
    // it triggers by pressing macOS cmd or ctrl + enter (13), when the "Done Line" button is enabled
    // might not be necessary, but it's kind of nice
    // note we use passEnabledRef instead of passEnabled because it gets the current value
        if (passEnabledRef.current && (ctrlKey || metaKey) && (key === "Enter" || charCode === 13)) {
            if (onLastContribution) {
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
                                    <Fade in={shouldDisplaySecondLine} timeout={1000}>
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
                            onClick={onLastContribution
                                ? completePoem
                                : passTurn}
                            disabled={!passEnabled}
                        >
                            {onLastContribution
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
                        {completeEarlyBoxOpen
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
