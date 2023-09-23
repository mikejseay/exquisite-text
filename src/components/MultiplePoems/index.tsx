import * as React from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from "react-responsive-carousel";

import {
    poemTitle,
} from "./styles";

import {
    ILine,
    IUserTableInfo,
} from "../../types";
import { useSocket } from "../App";
import PoemLinesAnimated from "../PoemLinesAnimated";
import PoemLines from "../PoemLines";
import isNil from "lodash/isNil";
import { lineSepString } from "../../constants";
import { poemsLines as poemsLinesTestData } from "../../data/multiplePoems";
import { userInfo as userInfoTestData } from "../../data/userInfo";

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

function maxWidthOfPoemsLines(poemsLines: Array<ILine[]>) {

    let maxWidth = 0;
    for (const poemLines of poemsLines) {
        for (const line of poemLines) {
            const currentSingleLine = line.content.split(lineSepString)[0];
            const currentWidth = getTextWidth(currentSingleLine, "18pt Esteban");
            if (isNil(currentWidth)) {
                continue;
            }
            if (currentWidth > maxWidth) {
                maxWidth = currentWidth;
            }
        }
    }
    maxWidth *= 0.77;

    return maxWidth;

}

function MultiplePoems({ shouldTest }: { shouldTest: boolean }) {
    // define poemsLines and userInfo constantly for testing purposes

    const { socket } = useSocket();

    const [ poemsLines, setPoemsLines ] = React.useState<Array<ILine[]>>([]);
    const [ userInfo, setUserInfo ] = React.useState<IUserTableInfo>({} as IUserTableInfo);

    const [ reRender, setReRender ] = React.useState<boolean>(false);

    React.useEffect(() => {

        if (shouldTest) {
            setPoemsLines(poemsLinesTestData);
            setUserInfo(userInfoTestData);
        } else {
            socket.emit("getUserTableInfo");

            const poemsLinesListener = (myPoemLines: ILine[]) => {
                setPoemsLines(prevPoemsLines => {
                    return [ ...prevPoemsLines, myPoemLines ];
                });
            };

            const userTableInfoListener = (info: IUserTableInfo) => {
                setUserInfo(info);
                socket.off("userTableInfo", userTableInfoListener);
            };

            socket.on("poemLines", poemsLinesListener);
            socket.on("userTableInfo", userTableInfoListener);

            setPoemsLines([]);
            socket.emit("getPoemsLines");

            return () => {
                socket.off("poemLines", poemsLinesListener);
                socket.off("userTableInfo", userTableInfoListener);
            };
        }

    }, [ socket ]);

    const maxWidth = maxWidthOfPoemsLines(poemsLines);

    const renderPoems = (reRender: boolean) => {
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
                {/*<PoemLines poemLines={poemLines} userInfo={userInfo} width={maxWidth} />*/}
                <PoemLinesAnimated
                    poemLines={poemLines}
                    userInfo={userInfo}
                    width={maxWidth}
                    reRender={reRender}
                    setReRender={setReRender}
                />
            </div>
        ));
    };

    return (
        <div
            className={"multiple-poems"}
            style={{ width: `${maxWidth + 60}px` }}
        >
            {poemsLines.length > 1
                ?
                <Carousel
                    onChange={() => {
                        setReRender(true);
                    }}
                    showThumbs={false}
                >
                    {renderPoems(reRender)}
                </Carousel>
                : renderPoems(reRender)}
        </div>
    );
}

export default MultiplePoems;
