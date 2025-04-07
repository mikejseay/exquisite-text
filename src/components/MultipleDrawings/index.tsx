// src/components/MultipleDrawings/index.tsx
import React from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";

import { logger } from "../../utilities/loggerUtils";
import { title } from "./styles";
import { Point } from "../../types";
import { CompletedDrawing } from "../CompletedDrawings";

export const renderDrawings = (
    completedDrawings: Point[][][][] | null,
    reRenderIndex?: number,
    shouldAnimate = false,
) => {
    logger.debug("IN renderDrawings...");
    logger.debug({ completedDrawings });
    return completedDrawings?.map((completedDrawing, index) => (
        <div
            key={index}
            className={"drawing-container"}
            style={{}}
        >
            <div style={title} className={"drawing-title"}>
                <strong>{`exquisite corpse #${index}`}</strong>
            </div>
            <CompletedDrawing completedDrawing={completedDrawing} shouldAnimate={shouldAnimate} />
        </div>
    ));
};

function MultipleDrawings(
    { completedDrawings, shouldAnimate }: { completedDrawings: Point[][][][] | null, shouldAnimate: boolean },
) {
    const [ reRender, setReRenderIndex ] = React.useState<number>(-1);
    // TODO: get dimensions from context and use in below commented code

    return (
        <div className={"multiple-drawings"} style={{
            width: "100%",
            // display: "flex",
            // justifyContent: "space-between",
            // height: dimensions.height,
        }}>
            {completedDrawings && completedDrawings.length > 1
                ?
                // renderDrawings(completedDrawings, reRender, shouldAnimate)
                (
                    <Carousel
                        onChange={(slideIndex) => {
                            setReRenderIndex(slideIndex);
                        }}
                        showThumbs={false}
                    >
                        {renderDrawings(completedDrawings, reRender, shouldAnimate)}
                    </Carousel>
                )
                : (
                    renderDrawings(completedDrawings, reRender, shouldAnimate)
                )}
        </div>
    );
}

export default MultipleDrawings;
