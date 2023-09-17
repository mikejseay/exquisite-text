import React, { useEffect, useState } from "react";
import { ILine, IUserTableInfo } from "../../types";
import { lineSepString } from "../../constants";

const DEFAULT_MS = 30;

interface TypewriterPoemProps {
    poemLines: ILine[];
    userInfo: IUserTableInfo;
    speed?: number;
    random?: number;
    delay?: number;
}

export default function TypewriterPoem({
    poemLines,
    userInfo,
    speed = DEFAULT_MS,
    random = DEFAULT_MS,
    delay = DEFAULT_MS,
}: TypewriterPoemProps) {
    const { editorColorObj } = userInfo;

    const [ stringArray, colorArray ] = poemLines.reduce(
        ([ strings, colors ], line) => {
            strings.push(line.content.slice(0, line.editLength), line.content.slice(line.editLength) + lineSepString);
            colors.push(editorColorObj[line.passerDevice], editorColorObj[line.authorDevice]);
            return [ strings, colors ];
        },
        [ [], [] ] as [string[], string[]],
    );

    const [ currentStringIndex, setCurrentStringIndex ] = useState(0);
    const [ currentTextIndex, setCurrentTextIndex ] = useState(0);
    const [ currentTextArray, setCurrentTextArray ] = useState<number[]>([ 0 ]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (currentTextIndex < stringArray[currentStringIndex].length) {
                incrementCurrentText();
            } else if (currentStringIndex < stringArray.length - 1) {
                setTimeout(() => {
                    resetCurrentText();
                    incrementCurrentString();
                }, delay);
            }
        }, speed + Math.random() * random);

        return () => clearTimeout(timeout);
    });

    const incrementCurrentText = () => {
        setCurrentTextIndex((prevIndex) => prevIndex + 1);

        setCurrentTextArray((prevArray) => {
            const newArray = [ ...prevArray ];
            newArray[currentStringIndex] += 1;
            return newArray;
        });
    };

    const resetCurrentText = () => setCurrentTextIndex(0);

    const incrementCurrentString = () => {
        setCurrentStringIndex((prevIndex) => prevIndex + 1);
        setCurrentTextArray((prevArray) => [ ...prevArray, 0 ]);
    };

    return (
        <div style={{ whiteSpace: "pre-line" }}>
            {stringArray.slice(0, currentStringIndex + 1).map((string, index) => (
                <span key={index} className="piece" style={{ color: colorArray[index] }}>
                    {string.substring(0, currentTextArray[index])}
                </span>
            ))}
        </div>
    );
}
