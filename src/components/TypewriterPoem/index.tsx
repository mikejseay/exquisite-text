import React, { useEffect, useState } from "react";
import { ILine, IUserTableInfo } from "../../types";
import { lineSepString } from "../../constants";

const DEFAULT_MS = 30;

interface TypewriterPoemProps {
    poemLines: ILine[];
    userInfo: IUserTableInfo;
    shouldAnimate: boolean;
    reRender: boolean;
    setReRender: (value: boolean | ((prevVar: boolean) => boolean)) => void;
    width: number;
    speed?: number;
    random?: number;
    delay?: number;
}

export default function TypewriterPoem({
    poemLines,
    userInfo,
    shouldAnimate,
    reRender,
    setReRender,
    width,
    speed = DEFAULT_MS,
    random = DEFAULT_MS,
    delay = DEFAULT_MS,
}: TypewriterPoemProps) {
    const { editorColorObj } = userInfo;
    const nLines = poemLines.length;

    const [ pieceArray, colorArray ] = poemLines.reduce(
        ([ strings, colors ], line) => {
            strings.push(line.content.slice(0, line.editLength), line.content.slice(line.editLength) + lineSepString);
            colors.push(editorColorObj[line.passerDevice], editorColorObj[line.authorDevice]);
            return [ strings, colors ];
        },
        [ [], [] ] as [string[], string[]],
    );

    // Each "piece" is half of one player's contribution in a single turn.
    // The first part is the completion of the current line
    // The second part is the initiation of a new line
    const [ currentPiece, setCurrentPiece ] = useState(0);

    // This variable helps us keep track of the typing of the current piece
    const [ currentLetter, setCurrentLetter ] = useState(0);

    // This variable keeps track of the lengths of all the pieces
    const [ currentPieceLengths, setCurrentPieceLengths ] = useState<number[]>([ 0 ]);

    const incrementCurrentLetter = () => {
        setCurrentLetter((prevIndex) => prevIndex + 1);

        setCurrentPieceLengths((prevPieceLengths) => {
            const newPieceLengths = [ ...prevPieceLengths ];
            newPieceLengths[currentPiece] += 1;
            return newPieceLengths;
        });
    };

    const incrementCurrentPiece = () => {
        setCurrentPiece((prevIndex) => prevIndex + 1);
        setCurrentPieceLengths((prevArray) => [ ...prevArray, 0 ]);
    };

    const resetCurrentLetter = () => setCurrentLetter(0);

    const resetEverything = () => {
        setCurrentPiece(0);
        setCurrentLetter(0);
        setCurrentPieceLengths([ 0 ]);
        setReRender(false);
    };

    useEffect(() => {

        if (!shouldAnimate) {
            return;
        }

        if (reRender) {

            const timeout = setTimeout(() => {
                resetEverything();
            }, speed + random + 20);
            return () => clearTimeout(timeout);

        } else {

            const timeout = setTimeout(() => {
                // If we haven't reached the end of the current piece
                if (currentLetter < pieceArray[currentPiece].length) {
                    // Show the next letter of the current piece
                    incrementCurrentLetter();
                // But if we *have* reached the end of the current piece
                } else if (currentPiece < pieceArray.length - 1) {
                    // Go to the next piece and start from the beginning
                    setTimeout(() => {
                        incrementCurrentPiece();
                        resetCurrentLetter();
                    }, (currentPiece % 2) == 1 ?
                        delay / 2 :
                        delay);
                }
            }, speed + Math.random() * random);
            return () => clearTimeout(timeout);

        }
    });

    return (
        <div style={{
            whiteSpace: "pre-line",
            height: `${nLines + 4}em`,
            width: `${width}px`,
            display: "inline-block",
            textAlign: "left",
            fontFamily: "'Esteban', serif",
            fontSize: "18px",
        }}>
            {shouldAnimate
                ?
                pieceArray.slice(0, currentPiece + 1).map((string, index) => (
                    <span key={index} className={"piece"} style={{ color: colorArray[index] }}>
                        {string.substring(0, currentPieceLengths[index])}
                    </span>
                ))
                :
                pieceArray.map((string, index) => (
                    <span key={index} className={"piece"} style={{ color: colorArray[index] }}>
                        {string}
                    </span>
                ))
            }
        </div>
    );
}
