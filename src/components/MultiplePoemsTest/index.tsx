import * as React from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from "react-responsive-carousel";

import {
    poemTitle,
    poemsBody,
} from "./styles";

import {
    ILine,
    IUserTableInfo,
} from "../../types";
import PoemLines from "../PoemLines";
import PoemLinesAnimated from "../PoemLinesAnimated";
import { lineSepString } from "../../constants";
import isNil from "lodash/isNil";
import { HTMLProps } from "react";

function getTextWidth(text: string, font: string) {
    // re-use canvas object for better performance
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!isNil(context)) {
        context.font = font;
        const metrics = context.measureText(text);
        return metrics.width;
    } else {
        return null;
    }
}

function MultiplePoemsTest() {
    // define poemsLines and userInfo constantly for testing purposes

    // const [ poemsLines, setPoemsLines ] = React.useState<Array<ILine[]>>([]);
    // const [ userInfo, setUserInfo ] = React.useState<IUserTableInfo>({} as IUserTableInfo);

    const userInfo = {
        editorColorArr: [ "#4F71BE", "#B86029" ],
        editorColorObj: {
            "8389a55c-b205-4e94-b6f5-6cbec0a66964": "#B86029",
            "99090583-9f23-480d-8b34-dc5b500011f1": "#4F71BE",
        },
        editors: [ "A", "B" ],
        spectators: [],
    };

    const poemsLines = [
        [
            {
                addedAt: new Date(),
                authorDevice: "99090583-9f23-480d-8b34-dc5b500011f1",
                content: "Here we are simply creating test data --",
                editLength: 0,
                lineIndex: 0,
                passerDevice: "",
                poemID: "9241c7c4-722e-4171-a123-57c14ce53cdc",
            },
            {
                addedAt: new Date(),
                authorDevice: "8389a55c-b205-4e94-b6f5-6cbec0a66964",
                content: "I hope that I remember , trying to eat me",
                editLength: 22,
                lineIndex: 1,
                passerDevice: "99090583-9f23-480d-8b34-dc5b500011f1",
                poemID: "9241c7c4-722e-4171-a123-57c14ce53cdc",
            },
            {
                addedAt: new Date(),
                authorDevice: "99090583-9f23-480d-8b34-dc5b500011f1",
                content: "like I'm made of candy, the voyeuristic narcissists",
                editLength: 23,
                lineIndex: 2,
                passerDevice: "8389a55c-b205-4e94-b6f5-6cbec0a66964",
                poemID: "9241c7c4-722e-4171-a123-57c14ce53cdc",
            },
            {
                addedAt: new Date(),
                authorDevice: "8389a55c-b205-4e94-b6f5-6cbec0a66964",
                content: "that fill the average this again, when my",
                editLength: 21,
                lineIndex: 3,
                passerDevice: "99090583-9f23-480d-8b34-dc5b500011f1",
                poemID: "9241c7c4-722e-4171-a123-57c14ce53cdc",
            },
            {
                addedAt: new Date(),
                authorDevice: "99090583-9f23-480d-8b34-dc5b500011f1",
                content:
                    "mind is rotten with time, like a candy monster\nwith nails of sugar, the voyeuristic narcissists.",
                editLength: 24,
                lineIndex: 4,
                passerDevice: "8389a55c-b205-4e94-b6f5-6cbec0a66964",
                poemID: "9241c7c4-722e-4171-a123-57c14ce53cdc",
            },
        ],
        [
            {
                addedAt: new Date(),
                authorDevice: "8389a55c-b205-4e94-b6f5-6cbec0a66964",
                content: "this again, when my mind is rotten with",
                editLength: 0,
                lineIndex: 0,
                passerDevice: "",
                poemID: "9a5d792c-2edb-4fe4-aed5-f89e43be8746",
            },
            {
                addedAt: new Date(),
                authorDevice: "99090583-9f23-480d-8b34-dc5b500011f1",
                content: "time, trying to eat me like a candy monster",
                editLength: 22,
                lineIndex: 1,
                passerDevice: "8389a55c-b205-4e94-b6f5-6cbec0a66964",
                poemID: "9a5d792c-2edb-4fe4-aed5-f89e43be8746",
            },
            {
                addedAt: new Date(),
                authorDevice: "8389a55c-b205-4e94-b6f5-6cbec0a66964",
                content: "with nails of sugar we are creating test data --",
                editLength: 19,
                lineIndex: 2,
                passerDevice: "99090583-9f23-480d-8b34-dc5b500011f1",
                poemID: "9a5d792c-2edb-4fe4-aed5-f89e43be8746",
            },
            {
                addedAt: new Date(),
                authorDevice: "99090583-9f23-480d-8b34-dc5b500011f1",
                content: "I hope that I remember trying to eat me",
                editLength: 22,
                lineIndex: 3,
                passerDevice: "8389a55c-b205-4e94-b6f5-6cbec0a66964",
                poemID: "9a5d792c-2edb-4fe4-aed5-f89e43be8746",
            },
            {
                addedAt: new Date(),
                authorDevice: "8389a55c-b205-4e94-b6f5-6cbec0a66964",
                content:
                    "like I'm made of candy that fills the average\ncomputer screen around here.",
                editLength: 22,
                lineIndex: 4,
                passerDevice: "99090583-9f23-480d-8b34-dc5b500011f1",
                poemID: "9a5d792c-2edb-4fe4-aed5-f89e43be8746",
            },
        ],
    ];

    // React.useEffect(() => {
    //
    //     socket.emit("getUserTableInfo");
    //
    //     const poemsLinesListener = (myPoemLines: ILine[]) => {
    //         setPoemsLines(prevPoemsLines => {
    //             return [ ...prevPoemsLines, myPoemLines ];
    //         });
    //     };
    //
    //     const userTableInfoListener = (info: IUserTableInfo) => {
    //         setUserInfo(info);
    //         socket.off("userTableInfo", userTableInfoListener);
    //     };
    //
    //     socket.on("poemLines", poemsLinesListener);
    //     socket.on("userTableInfo", userTableInfoListener);
    //
    //     setPoemsLines([]);
    //     socket.emit("getPoemsLines");
    //
    //     return () => {
    //         socket.off("poemLines", poemsLinesListener);
    //         socket.off("userTableInfo", userTableInfoListener);
    //     };
    // }, [ socket ]);
    let maxWidth = 0;
    for (const poemLines of poemsLines) {
        for (const line of poemLines) {
            const currentSingleLine = line.content.split(lineSepString)[0];
            const currentWidth = getTextWidth(currentSingleLine, "18pt Esteban");
            console.log(currentSingleLine, "has width", currentWidth);
            if (isNil(currentWidth)) {
                continue;
            }
            if (currentWidth > maxWidth) {
                maxWidth = currentWidth;
            }
            // maxWidth = Math.max(maxWidth, line.content.split(lineSepString)[0].length);
        }
    }
    maxWidth *= 0.77;

    const renderPoems = () => {
        return poemsLines.map((poemLines, poemLinesIndex) => (
            <div
                key = {poemLinesIndex}
                className={"poem-container"}
                style={{
                    width: `${maxWidth}px`,
                    marginLeft: "auto",
                    marginRight: "auto",
                }}
            >
                <div style={poemTitle} className={"poem-title"}>
                    <strong>{`exquisite text #${poemLinesIndex}`}</strong>
                </div>
                {/*<PoemLines poemLines={poemLines} userInfo={userInfo} />*/}
                <PoemLinesAnimated poemLines={poemLines} userInfo={userInfo} width={maxWidth} />
            </div>
        ));
    };

    return (
        <div
            className={"multiple-poems"}
            style={{ width: `${maxWidth + 60}px` }}
        >
            {poemsLines.length > 1
                ? <Carousel>{renderPoems()}</Carousel>
                : renderPoems()}
        </div>
    );
}

export default MultiplePoemsTest;
