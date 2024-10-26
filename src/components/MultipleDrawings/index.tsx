import React, { useEffect, useRef } from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from "react-responsive-carousel";

import { useSocketInfo } from "../../context/SocketInfoProvider";
import { DRAWING_HEIGHT, DRAWING_WIDTH, OVERLAP, PANEL_HEIGHT, drawOnCanvas } from "../../screens/Canvas";
import { title } from "./styles";
import { Point } from "../../types";

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

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        const devicePixelRatio = window.devicePixelRatio ?? 1;

        // Set canvas dimensions
        canvas.style.width = `${DRAWING_WIDTH}px`;
        canvas.style.height = `${DRAWING_HEIGHT}px`;
        canvas.width = DRAWING_WIDTH * devicePixelRatio;
        canvas.height = DRAWING_HEIGHT * devicePixelRatio;
        console.log("canvas.height:", canvas.height);

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (shouldAnimate) {
            // Animation code
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
                const strokeArray = strokeHistory[strokeHistoryIndex]?.map(point => ({
                    x: point.x * window.devicePixelRatio,
                    y: point.y * window.devicePixelRatio,
                    lineWidth: point.lineWidth * window.devicePixelRatio,
                }));

                if (strokeArray) {
                    drawOnCanvas(strokeArray, canvasRef, yOffset);
                    strokeHistoryIndex++;
                } else {
                    // Move to next panel
                    panelIndex++;
                    strokeHistoryIndex = 0;
                    yOffset += PANEL_HEIGHT * (1 - OVERLAP) * window.devicePixelRatio;
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
            // Static functionality: draw all at once
            let yOffset = 0;
            completedDrawing.forEach((strokeHistory) => {
                strokeHistory.forEach((strokeArray) => {
                    drawOnCanvas(strokeArray?.map(point => ({
                        x: point.x * window.devicePixelRatio,
                        y: point.y * window.devicePixelRatio,
                        lineWidth: point.lineWidth * window.devicePixelRatio,
                    })), canvasRef, yOffset);
                });
                yOffset += PANEL_HEIGHT * (1 - OVERLAP) * window.devicePixelRatio;
            });
        }
    }, [ completedDrawing, shouldAnimate ]);

    useEffect(() => {
        const disableScroll = (e: TouchEvent) => e.preventDefault();
        document.body.addEventListener("touchmove", disableScroll, { passive: false });

        return () => {
            document.body.removeEventListener("touchmove", disableScroll);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <canvas
                ref={canvasRef}
                onMouseDown={()=> {return;}}
                onTouchStart={()=> {return;}}
                onMouseMove={()=> {return;}}
                onTouchMove={()=> {return;}}
                onMouseUp={()=> {return;}}
                onTouchEnd={()=> {return;}}
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
    if (!completedDrawings || completedDrawings?.length === 0) {
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
