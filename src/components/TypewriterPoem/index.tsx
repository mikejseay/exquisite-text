import React, { useEffect, useState } from "react";
const DEFAULT_MS = 30;

import {
    ILine,
    IUserTableInfo,
} from "../../types";
import { lineSepString } from "../../constants";

export default function TypewriterPoem(
    { poemLines,
        userInfo,
        speed = DEFAULT_MS,
        random = DEFAULT_MS,
        delay = DEFAULT_MS,
    }: { poemLines: ILine[], userInfo: IUserTableInfo, speed: number, random: number, delay: number}) {
    const {
        editorColorObj,
    } = userInfo;
    // const nLines = poemLines.length;
    const stringArray: string[] = [];
    const colorArray: string[] = [];
    for (const line of poemLines) {

        stringArray.push(line.content.slice(0, line.editLength));
        colorArray.push(editorColorObj[line.passerDevice]);

        stringArray.push(line.content.slice(line.editLength) + lineSepString);
        colorArray.push(editorColorObj[line.authorDevice]);
    }
    const [ currentStringIndex, setCurrentStringIndex ] = useState(0);
    const [ currentTextIndex, setCurrentTextIndex ] = useState(0);
    const [ currentTextArray, setCurrentTextArray ] = useState<Array<number>>([ 0 ]);
    useEffect(() => {
        setTimeout(() => {
            if (currentTextIndex < stringArray[currentStringIndex].length) {

                setCurrentTextIndex(currentTextIndex + 1);

                const nextCurrentTextArray = [ ...currentTextArray ];
                nextCurrentTextArray[currentStringIndex] += 1;
                setCurrentTextArray(nextCurrentTextArray);
            }
            else {
                if (currentStringIndex < stringArray.length - 1) {
                    setTimeout(() => {
                        setCurrentTextIndex(0);
                        setCurrentStringIndex(currentStringIndex + 1);

                        const nextCurrentTextArray = [ ...currentTextArray ];
                        nextCurrentTextArray.push(0);
                        setCurrentTextArray(nextCurrentTextArray);
                    }, delay);
                }
            }
        }, speed + (Math.random() * random));
    });
    return (
        <div style={{ whiteSpace: "pre-line" }}>
            {stringArray.slice(0, currentStringIndex + 1).map((string, index) => {
                return <span key={index} className={"piece"} style={{ color: colorArray[index] }}>
                    {string.substring(0, currentTextArray[index])}
                </span>;
            })}
        </div>
    );
}
