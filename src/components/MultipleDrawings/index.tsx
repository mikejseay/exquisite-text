// src/components/MultipleDrawings/index.tsx
import React, { useEffect, useRef } from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";

import { useSocketInfo } from "../../context/SocketInfoProvider";
import { DRAWING_HEIGHT, DRAWING_WIDTH, OVERLAP, PANEL_HEIGHT } from "../../screens/Canvas";
import { title } from "./styles";
import { Point } from "../../types";
import { drawOnCanvas, setCanvasDimensions, setCanvasProperties } from "../../utils/canvasUtils";
import { useDisableScroll } from "../../hooks/useDisableScroll";

const CompletedDrawing = ({
    completedDrawing,
    shouldAnimate,
}: {
    completedDrawing: Point[][][];
    shouldAnimate: boolean;
}): JSX.Element | null => {
    if (completedDrawing?.length === 0) {
        return null;
    }

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationRef = useRef<number>();

    useDisableScroll();

    // Set initial dimensions of the canvas
    useEffect(() => {
        setCanvasDimensions(canvasRef.current, DRAWING_WIDTH, DRAWING_HEIGHT);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        context.clearRect(0, 0, canvas.width, canvas.height);

        setCanvasProperties(context);

        if (shouldAnimate) {
            let panelIndex = 0;
            let strokeHistoryIndex = 0;
            let yOffset = 0;

            const totalPanels = completedDrawing.length;

            const draw = () => {
                if (panelIndex >= totalPanels) {
                    cancelAnimationFrame(animationRef.current!);
                    return;
                }

                const strokeHistory = completedDrawing[panelIndex];
                const strokeArray = strokeHistory[strokeHistoryIndex];

                if (strokeArray) {
                    drawOnCanvas(strokeArray, yOffset, context);
                    strokeHistoryIndex++;
                } else {
                    panelIndex++;
                    strokeHistoryIndex = 0;
                    yOffset += PANEL_HEIGHT * (1 - OVERLAP);
                }

                animationRef.current = requestAnimationFrame(draw);
            };

            draw();

            return () => {
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
            };
        } else {
            let yOffset = 0;
            completedDrawing.forEach((strokeHistory) => {
                strokeHistory.forEach((strokeArray) => {
                    drawOnCanvas(strokeArray, yOffset, context);
                });
                yOffset += PANEL_HEIGHT * (1 - OVERLAP);
            });
        }
    }, [ completedDrawing, shouldAnimate ]);

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <canvas
                ref={canvasRef}
                style={{ border: "1px solid black" }}
            >
                Sorry, your browser is too old for this demo.
            </canvas>
        </div>
    );
};

const renderDrawings = (
    completedDrawings: Point[][][][] | null,
    reRenderIndex: number,
    shouldAnimate: boolean,
) => {
    return completedDrawings?.map((completedDrawing, index) => (
        <div
            key={index}
            className={"drawing-container"}
            style={{
                marginLeft: "auto",
                marginRight: "auto",
            }}
        >
            <div style={title} className={"drawing-title"}>
                <strong>{`exquisite corpse #${index}`}</strong>
            </div>
            <CompletedDrawing completedDrawing={completedDrawing} shouldAnimate={shouldAnimate} />
        </div>
    ));
};

function MultipleDrawings({ shouldAnimate }: { shouldAnimate: boolean }) {
    const [ reRender, setReRenderIndex ] = React.useState<number>(-1);
    const { completedDrawings } = useSocketInfo();
    if (!completedDrawings || completedDrawings.length === 0) {
        return null;
    }

    return (
        <div className={"multiple-drawings"}>
            {completedDrawings && completedDrawings.length > 1
                ? (
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
