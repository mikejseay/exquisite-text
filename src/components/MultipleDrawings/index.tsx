// src/components/MultipleDrawings/index.tsx
import React from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";

import { title } from "./styles";
import { Point } from "../../types";
import { CompletedDrawing } from "../CompletedDrawings";

const renderDrawings = (
    completedDrawings: Point[][][][] | null,
    shouldAnimate = false,
) => {
    return completedDrawings?.map((completedDrawing, index) => (
        <div key={index} className={"drawing-container"}>
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
    return (
        <div className={"multiple-drawings"} style={{ width: "100%" }}>
            {completedDrawings && completedDrawings.length > 1
                ? (
                    <Carousel showThumbs={false}>
                        {renderDrawings(completedDrawings, shouldAnimate)}
                    </Carousel>
                )
                : renderDrawings(completedDrawings, shouldAnimate)
            }
        </div>
    );
}

export default MultipleDrawings;
