import React, { useEffect, useRef, useState } from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from "react-responsive-carousel";
import { isNil } from "es-toolkit";

import { useSocketInfo } from "../../context/SocketInfoProvider";
import { DRAWING_HEIGHT_RATIO_OF_WINDOW, OVERLAP, PANEL_HEIGHT_RATIO_OF_WINDOW, drawOnCanvas } from "../../screens/Canvas";
import { title } from "./styles";
import { Point } from "../../types";

// Drawing
// Panels
// Strokes
// Vector Points

const CompletedDrawing = ({ completedDrawing }: { completedDrawing: Point[][][] }): JSX.Element => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    console.log("completedDrawing in CompletedDrawing:", completedDrawing);
    if (canvas && context) {
        const devicePixelRatio = window?.devicePixelRatio ?? 1;
        const panelHeight = window?.innerHeight * devicePixelRatio * PANEL_HEIGHT_RATIO_OF_WINDOW;

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        let yOffset = 0;

        completedDrawing?.forEach(strokeHistory => {
            // Redraw stroke history onto blank canvas
            strokeHistory?.forEach(strokeArray => drawOnCanvas(strokeArray, canvasRef, yOffset));
            yOffset += Math.floor(panelHeight);
        });
    }

    // This useEffect defines the canvas height
    useEffect(() => {
        const canvas = canvasRef.current;
        const devicePixelRatio = window.devicePixelRatio ?? 1;

        if (!canvas) return;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight * DRAWING_HEIGHT_RATIO_OF_WINDOW}px`;
        canvas.width = window.innerWidth * devicePixelRatio;
        canvas.height = window.innerHeight * devicePixelRatio * DRAWING_HEIGHT_RATIO_OF_WINDOW;
    }, []);

    useEffect(() => {
        const disableScroll = (e: TouchEvent) => e.preventDefault();
        document.body.addEventListener("touchmove", disableScroll, { passive: false });

        return () => {
            document.body.removeEventListener("touchmove", disableScroll);
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
            >
                Sorry, your browser is too old for this demo.
            </canvas>
        </div>
    );
};

// TODO: shouldAnimate for drawings
function MultipleDrawings({ shouldAnimate }: { shouldAnimate: boolean }) {
    const [ reRender, setReRenderIndex ] = React.useState<number>(-1);
    const { completedDrawings } = useSocketInfo();
    if (!completedDrawings) {
        return null;
    }

    const renderDrawings = (reRenderIndex: number) => {
        return completedDrawings.map((completedDrawing, index) => (
            <div
                key = {index}
                className={"drawing-container"}
                style={{
                    // width: `${maxWidth}px`,
                    marginLeft: "auto",
                    marginRight: "auto",
                }}
            >
                <div style={title} className={"drawing-title"}>
                    <strong>{`exquisite corpse #${index}`}</strong>
                </div>
                <CompletedDrawing
                    completedDrawing={completedDrawing}
                />
            </div>
        ));
    };

    return (
        <div
            className={"multiple-drawings"}
            // style={{ width: `${maxWidth + 60}px` }}
        >
            {completedDrawings.length > 1
                ?
                <Carousel
                    onChange={(slideIndex) => {
                        setReRenderIndex(slideIndex);
                    }}
                    showThumbs={false}
                >
                    {renderDrawings(reRender)}
                </Carousel>
                : renderDrawings(reRender)}
        </div>
    );
}

export default MultipleDrawings;
