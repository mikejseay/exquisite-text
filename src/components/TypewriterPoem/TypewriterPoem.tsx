import React, { useEffect, useState } from "react";
import { ILine } from "types/types";
import { lineSepString } from "constants/constants";
import { useSocketInfo } from "context/SocketInfoProvider";
import { poemTypography } from "styles/common";

const DEFAULT_MS = 30;

interface TypewriterPoemProps {
    poemLines: ILine[];
    shouldAnimate: boolean;
    reRenderIndex: number;
    setReRender: (value: number | ((prevVar: number) => number)) => void;
    index: number;
    width: number;
    speed?: number;
    random?: number;
    delay?: number;
}

export default function TypewriterPoem({
    poemLines,
    shouldAnimate,
    reRenderIndex,
    setReRender,
    index,
    width,
    speed = DEFAULT_MS,
    random = DEFAULT_MS,
    delay = DEFAULT_MS,
}: TypewriterPoemProps) {
    const { userInfo } = useSocketInfo();
    if (!userInfo) {
        return null;
    }
    const { editorColorMap } = userInfo;
    const nLines = poemLines.length;

    const [ pieceArray, colorArray ] = poemLines.reduce(
        ([ strings, colors ], line) => {
            strings.push(line.content.slice(0, line.editLength), line.content.slice(line.editLength) + lineSepString);
            colors.push(editorColorMap[line.passerDevice], editorColorMap[line.authorDevice]);
            return [ strings, colors ];
        },
        [ [], [] ] as [string[], string[]],
    );

    // Remove the first elements; they are always empty
    pieceArray.shift();
    colorArray.shift();

    const [ isBeingViewed, setIsBeingViewed ] = useState(true);

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

    const initializeTypewriter = () => {
        setCurrentPiece(0);
        setCurrentLetter(0);
        setCurrentPieceLengths([ 0 ]);
    };

    // Whenever the animation toggle is toggled, initialize the typewriter
    useEffect(() => {
        initializeTypewriter();
    }, [ shouldAnimate ]);

    useEffect(() => {

        // If we aren't animating, don't do anything
        if (!shouldAnimate) {
            return;
        }

        // First check whether we are being viewed
        // If we receive the reRenderIndex for this poem, it should be re-set
        // This means initializing the animation and setting it as being viewed.
        if (reRenderIndex === index) {

            const timeout = setTimeout(() => {

                // Initialize the typewriter animation
                initializeTypewriter();

                // Re-initialize the state that tells which component to re-render
                // so that it's ready for the next one
                setReRender(-1);

                // Set this component as being viewed
                setIsBeingViewed(true);
            }, delay + 10);
            return () => clearTimeout(timeout);

        // If we receive the reRenderIndex for a different poem, then
        // this poem is not being viewed, and it should be initialized.
        } else if (reRenderIndex !== -1) {

            const timeout = setTimeout(() => {

                // Initialize the typewriter animation
                initializeTypewriter();

                // Set this component as not being viewed
                setIsBeingViewed(false);
            }, delay + 10);
            return () => clearTimeout(timeout);
        }

        // If we aren't being viewed, don't animate
        if (!isBeingViewed) {
            return;
        }

        // Otherwise, animate the typewriter
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
                }, (currentPiece % 2) == 0 ?
                    delay / 2 :
                    delay);
            }
        }, speed + Math.random() * random);
        return () => clearTimeout(timeout);
    });

    return (
        <div style={{
            ...poemTypography,
            whiteSpace: "pre-line",
            height: `${nLines + 4}em`,
            width: `${width}px`,
            textAlign: "left",
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
