import * as React from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader

import { poemTitle } from "components/MultiplePoems/styles";
import PoemLinesAnimated from "components/PoemLinesAnimated/PoemLinesAnimated";
import { lineSepString } from "constants/constants";
import { useSocketInfo } from "context/SocketInfoProvider";
import { isNil } from "helpers/helpers";
import { Carousel } from "react-responsive-carousel";
import type { ILine } from "types/types";

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

function MultiplePoems({ shouldAnimate }: { shouldAnimate: boolean }) {
    // define poemsLines and userInfo constantly for testing purposes

    const [reRender, setReRenderIndex] = React.useState<number>(-1);
    const { poemsLines } = useSocketInfo();
    if (!poemsLines) {
        return null;
    }

    const maxWidth = maxWidthOfPoemsLines(poemsLines);

    const renderPoems = (reRenderIndex: number) => {
        return poemsLines.map((poemLines, poemLinesIndex) => (
            <div
                key={poemLinesIndex}
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
                <PoemLinesAnimated
                    poemLines={poemLines}
                    width={maxWidth}
                    shouldAnimate={shouldAnimate}
                    reRenderIndex={reRenderIndex}
                    setReRender={setReRenderIndex}
                    index={poemLinesIndex}
                />
            </div>
        ));
    };

    return (
        <div className={"multiple-poems"} style={{ width: `${maxWidth + 60}px` }}>
            {poemsLines.length > 1 ? (
                <Carousel
                    onChange={(slideIndex) => {
                        setReRenderIndex(slideIndex);
                    }}
                    showThumbs={false}
                >
                    {renderPoems(reRender)}
                </Carousel>
            ) : (
                renderPoems(reRender)
            )}
        </div>
    );
}

export default MultiplePoems;
