// src/components/MultipleDrawings/index.tsx

import useMediaQuery from "@mui/material/useMediaQuery";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { CompletedDrawing } from "components/CompletedDrawings/CompletedDrawings";

import { title } from "components/MultipleDrawings/styles";
import { Carousel } from "react-responsive-carousel";
import type { Point } from "types/types";

const renderDrawings = (completedDrawings: Point[][][][] | null, shouldAnimate = false, topOffset = 0) => {
    return completedDrawings?.map((completedDrawing, index) => (
        <div key={index} className={"drawing-container"}>
            <div style={title} className={"drawing-title"}>
                <strong>{`exquisite corpse #${index}`}</strong>
            </div>
            <CompletedDrawing completedDrawing={completedDrawing} shouldAnimate={shouldAnimate} topOffset={topOffset} />
        </div>
    ));
};

function MultipleDrawings({
    completedDrawings,
    shouldAnimate,
    topOffset = 0,
}: {
    completedDrawings: Point[][][][] | null;
    shouldAnimate: boolean;
    topOffset?: number;
}) {
    const isWide = useMediaQuery("(min-width: 1200px)");
    const useGrid = isWide && completedDrawings && completedDrawings.length > 1;

    return (
        <div className={"multiple-drawings"} style={{ width: "100%" }}>
            {completedDrawings && completedDrawings.length > 1 ? (
                useGrid ? (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "1em",
                        }}
                    >
                        {renderDrawings(completedDrawings, shouldAnimate, topOffset)}
                    </div>
                ) : (
                    <Carousel showThumbs={false}>
                        {renderDrawings(completedDrawings, shouldAnimate, topOffset)}
                    </Carousel>
                )
            ) : (
                renderDrawings(completedDrawings, shouldAnimate, topOffset)
            )}
        </div>
    );
}

export default MultipleDrawings;
