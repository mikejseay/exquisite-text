import * as React from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from "react-responsive-carousel";

import {
    poemTitle,
} from "./styles";

import PoemLinesAnimated from "../PoemLinesAnimated";
import { poemsLines } from "../../data/multiplePoems";
import { userInfo } from "../../data/userInfo";
import isNil from "lodash/isNil";
import { ILine } from "../../types";
import { lineSepString } from "../../constants";

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

function MultiplePoemsTest() {
    // define poemsLines and userInfo constantly for testing purposes

    const [ reRender, setReRender ] = React.useState<boolean>(false);

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
                {/*<PoemLines poemLines={poemLines} userInfo={userInfo} />*/}
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

export default MultiplePoemsTest;
