// src/components/MultipleDrawings/index.tsx
import React, { useEffect, useRef, useState } from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";

import { useSocketInfo } from "../../context/SocketInfoProvider";
import {
    DRAWING_ASPECT_RATIO,
    DRAWING_HEIGHT_MIN,
    DRAWING_WIDTH_MIN,
    OVERLAP,
    PANEL_HEIGHT_MIN,
} from "../../screens/Canvas";
import { title } from "./styles";
import { Point } from "../../types";
import { drawOnCanvas, setCanvasProperties } from "../../utils/canvasUtils";
import { useDisableScroll } from "../../hooks/useDisableScroll";
import { ScaleDirection, scalePoints } from "../../utils/scaleUtils";

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
    const [ dimensions, setDimensions ] = useState({ width: DRAWING_WIDTH_MIN, height: DRAWING_HEIGHT_MIN });
    const [ scaleFactor, setScaleFactor ] = useState<number>(1);

    useDisableScroll();

    // Set initial dimensions of the canvas
    // useEffect(() => {
    //     setCanvasDimensions(canvasRef.current, DRAWING_WIDTH_MIN, DRAWING_HEIGHT_MIN);
    // }, []);

    // Handle resizing of the window
    useEffect(() => {
        const handleResize = () => {
            // Get the viewport width and calculate the new height to maintain the 2:1 ratio
            const viewportHeight = window.innerHeight - 150;
            const newHeight = Math.max(viewportHeight, DRAWING_HEIGHT_MIN); // Enforce minimum width
            const newWidth = Math.max(newHeight * DRAWING_ASPECT_RATIO, DRAWING_WIDTH_MIN); // Enforce minimum height

            setScaleFactor(newHeight / DRAWING_HEIGHT_MIN);
            setDimensions({ width: newWidth, height: newHeight });
        };

        // Initial size setup
        handleResize();

        // Attach resize event listener
        window.addEventListener("resize", handleResize);

        // Clean up event listener on component unmount
        return () => window.removeEventListener("resize", handleResize);
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
                const strokeArray = scalePoints(
                    strokeHistory[strokeHistoryIndex],
                    ScaleDirection.MULTIPLY,
                    scaleFactor,
                );

                if (strokeArray) {
                    drawOnCanvas(strokeArray, yOffset, context);
                    strokeHistoryIndex++;
                } else {
                    panelIndex++;
                    strokeHistoryIndex = 0;
                    yOffset += PANEL_HEIGHT_MIN * (1 - OVERLAP);
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
                    drawOnCanvas(
                        scalePoints(strokeArray, ScaleDirection.MULTIPLY, scaleFactor),
                        yOffset,
                        context,
                    );
                });
                yOffset += PANEL_HEIGHT_MIN * (1 - OVERLAP);
            });
        }
    }, [ completedDrawing, shouldAnimate ]);

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <canvas
                ref={canvasRef}
                width={dimensions.width}
                height={dimensions.height}
                style={{
                    border: "1px solid black",
                    width: "auto",           // Makes canvas fill the full width of the viewport
                    height: "100%",          // Keeps the 2:1 aspect ratio automatically
                    display: "block",        // Removes any padding/margin caused by inline canvas
                }}
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
