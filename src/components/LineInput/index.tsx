import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import isNil from "lodash/isNil";
import Button from "@mui/material/Button";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Typography from "@mui/material/Typography";


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
  textSpacer,
  underlineSuggestionDiv,
  underlineSpan,
  underlineSpanHover,
  spacingSpan,
  donePoemAccordionTitle,
  donePoemAccordionText,
  donePoemButton
} from "./styles";

// import type {
//   IUserInfo
// } from "../../types";
import { useSocket } from "../App";

// if activeEditor, the letters are visible and textarea is editable
// if inactiveEditor, the letters are invisible, and textarea is not editable
// if spectator, the letters are visible, but the textarea is not editable

// this function allows us to get the most current value of a state variable
// with the third output argument "ref"
// https://stackoverflow.com/questions/53845595/wrong-react-hooks-behaviour-with-event-listener
function useStateRef(initialValue: boolean) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return [value, setValue, ref] as const;
}

const LineInput = () => {
  const { socket } = useSocket();

  const minCharsOnLineOne = 30;
  const maxCharsOnLineOne = 70;
  const minCharsOnLineTwo = 18; // must have more than this many characters on 2nd line to make exquisite
  const maxCharsOnLineTwo = 36; // must have less than this many characters on 2nd line to make exquisite
  const idealCharsOnLineOne = 60;
  const idealCharsOnLineTwo = 30;
  const lineSepString = "\n";

  const [poemInput, setPoemInput] = useState("");
  const [doneLineEnabled, setDoneLine, doneLineRef] = useStateRef(false);
  const [onSecondLine, setOnSecondLine] = useState(false);

  // const [active, setActive] = React.useState<boolean>(false);

  const [lineInputVisible, setLineInputVisible] = useState(true);
  const [poemDoneAccordionVisible, setPoemDoneAccordionVisible] =
    useState(true);
  const [donePoemEnabled, setDonePoem] = useState(true);

  const [helpMessage, setHelpMessage] = useState("");
  const [inputErrorMsg, setInputErrorMsg] = useState(lineSepString);
  const textareaRef = useRef() as React.MutableRefObject<HTMLTextAreaElement | null>;

  useEffect(() => {

    const lineEditListener = (lineEdit: string) => {
      setPoemInput(lineEdit);
    };

    const editorActiveListener = (editorActiveFromServer: boolean) => {
      // setActive(editorActiveFromServer);
      setLineInputVisible(editorActiveFromServer);
    };

    // const checkIfActiveListener = () => {
    //   socket.emit("getEditorActive")
    // };

    // additionally, tell React to set the poem textarea to change
    // whenever a lineEdit event is emitted
    socket.on("lineEdit", lineEditListener);

    // tells the server for this client to do getLineEdit
    // since this is client-side, it only happens for this client
    socket.emit("getLineEdit");
    socket.emit("getEditorActive")

    socket.on("editorActive", editorActiveListener);
    // socket.on("checkIfActive", checkIfActiveListener);

    return () => {
      socket.off("lineEdit", lineEditListener);
      socket.off("editorActive", editorActiveListener);
    };
  }, [socket]);

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
        setHelpMessage("Now start the next line (Next player will see this.)");
      } else {
        setHelpMessage("Perfect. Pass the turn!");
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
        // setProgress(useInput.length / idealCharsOnLineOne);
        helpBasedOnProgress(1, useInput.length / idealCharsOnLineOne);
        setDoneLine(false);
      } else {
        setPoemInput(evt.target.value);
        socket.emit("lineEdit", evt.target.value);
        // setMessageType(1);
        // setProgress(evt.target.value.length / idealCharsOnLineOne);
        helpBasedOnProgress(1, evt.target.value.length / idealCharsOnLineOne);
        setDoneLine(false);
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
        // setProgress(maxCharsOnLineTwo / idealCharsOnLineTwo);
        helpBasedOnProgress(2, maxCharsOnLineTwo / idealCharsOnLineTwo);
        setDoneLine(true);
      } else if (lines[0].length < minCharsOnLineOne) {
        // first line too short

        setOnSecondLine(false);

        setPoemInput(lines[0]);
        socket.emit("lineEdit", lines[0]);
        sendNotification("More on first line!");
        // setMessageType(1);
        // setProgress(lines[0].length / idealCharsOnLineOne);
        helpBasedOnProgress(1, lines[0].length / idealCharsOnLineOne);
        setDoneLine(false);
      } else {
        // just right!

        setOnSecondLine(true);

        setPoemInput(evt.target.value);
        socket.emit("lineEdit", evt.target.value);
        // setMessageType(2);
        // setProgress(lines[1].length / idealCharsOnLineTwo);
        helpBasedOnProgress(2, lines[1].length / idealCharsOnLineTwo);
        setDoneLine(
          lines[1].length >= minCharsOnLineTwo &&
          lines[1].length <= maxCharsOnLineTwo
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
      // setProgress(maxCharsOnLineTwo / idealCharsOnLineTwo);
      setDoneLine(
        linesTwo[1].length >= minCharsOnLineTwo &&
        linesTwo[1].length <= maxCharsOnLineTwo
      );
    }
  }

  function passTurn() {
    // this function takes approximately 1.5 lines of poem, and "makes them exquisite" by clipping the 1st line.
    // the next person who sees the result should not be aware of the 1st line but must continue with a new line
    const poemParts = poemInput.split(lineSepString);

    // check user input, should be two lines, although access to even executing this function is regulated
    // by the doneLineRef value, which enables and disables the button
    if (poemParts.length > 1) {
      const [firstPart, secondPart] = poemParts;

      // broadcast that there was a change
      setPoemInput(secondPart);
      setOnSecondLine(false);

      // this client submits its line, triggering a movement of its poem from its queue
      // to the target queue
      socket.emit("passTurn", firstPart, secondPart);
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

    // this client only tell the server to do the ending event
    // socket.emit("poemDone");

    // this event should also set the value of the "lines" variable
    // in Lines.js to be initialized (an empty object)...
    // socket.emit("clearLines");

    // this client only tell the server to do the turn event, which sends user info appropriately
    // socket.emit("allTurns");
  }

  function handleKeypress({ charCode, ctrlKey }: KeyboardEvent) {
    // it triggers by pressing ctrl + enter (13), when the "Done Line" button is enabled
    // might not be necessary, but it's kind of nice
    // note we use doneLineRef instead of doneLineEnabled because it gets the current value
    if (doneLineRef.current && charCode === 13 && ctrlKey) {
      passTurn();
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
          {lineInputVisible ? (
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
                  {onSecondLine ? (
                    "  ".repeat(idealCharsOnLineOne + 3) + "\n" + "  ".repeat(idealCharsOnLineTwo + 3)
                  ) : (
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
                onKeyPress={handleKeypress}
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
          ) : (
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
                    {poemInput.replaceAll(/[^\n]/g, "*")}
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
              onClick={passTurn}
              disabled={!doneLineEnabled}
            >
              Pass
            </Button>
          </div>
        </div>
        {poemDoneAccordionVisible && (
          <div
            className={"done-poem-accordion"}
          >
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <div
                  className={"done-poem-accordion-title"}
                  style={donePoemAccordionTitle}
                >
                  <Typography>
                    <strong>Does the poem seem like it's done?</strong>
                  </Typography>
                </div>
              </AccordionSummary>
              <AccordionDetails>
                {/*<Typography>*/}
                <div
                  className={"done-poem-accordion-text"}
                  style={donePoemAccordionText}
                >
                  Only press this button if you're absolutely certain the poem
                  is done!
                </div>
                {/*</Typography>*/}
                <div
                  className={"done-poem-button"}
                  style={donePoemButton}
                >
                  <Button
                    variant={"contained"}
                    onClick={completePoem}
                    disabled={!donePoemEnabled}
                  >
                    Complete Poem
                  </Button>
                </div>
              </AccordionDetails>
            </Accordion>
          </div>
        )}
      </div>
    </div>
  );
};

export default LineInput;
