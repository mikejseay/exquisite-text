import React, { useEffect, useRef } from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from "react-responsive-carousel";

import { useSocketInfo } from "../../context/SocketInfoProvider";
import { PANEL_HEIGHT, PANEL_WIDTH, drawOnCanvas } from "../../screens/Canvas";
import { title } from "./styles";
import { Point } from "../../types";

// Drawing
// Panels
// Strokes
// Vector Points

const CompletedDrawing = ({ completedDrawing }: { completedDrawing: Point[][][] }): JSX.Element | null => {
    // This useEffect defines the canvas height
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    useEffect(() => {
        console.log("completed drawing in completedDrawing component", completedDrawing );

        const devicePixelRatio = window.devicePixelRatio ?? 1;
        console.log("before canvas not null");
        // if (!canvas) return;
        console.log("before canvas null");

        // TODO: use all available pixels instead of fixed size
        // canvas.style.width = `${window.innerWidth}px`;
        // canvas.style.height = `${window.innerHeight * DRAWING_HEIGHT_RATIO_OF_WINDOW}px`;
        // canvas.width = window.innerWidth * devicePixelRatio;
        // canvas.height = window.innerHeight * devicePixelRatio * DRAWING_HEIGHT_RATIO_OF_WINDOW;


        console.log("completedDrawing in CompletedDrawing:", completedDrawing);
        if (canvas && context) {
        // Clear canvas
            canvas.style.width = `${PANEL_WIDTH}px`;
            canvas.style.height = `${PANEL_HEIGHT * 3}px`;
            canvas.width = PANEL_WIDTH * devicePixelRatio;
            canvas.height = PANEL_HEIGHT * devicePixelRatio * 3;

            context.clearRect(0, 0, canvas.width, canvas.height);
            let yOffset = 0;
    
            completedDrawing?.forEach(strokeHistory => {
            // Redraw stroke history onto blank canvas
                strokeHistory?.forEach(strokeArray => drawOnCanvas(strokeArray, canvasRef, yOffset));
                yOffset += PANEL_HEIGHT;
            });
        }
    }, [ canvas, completedDrawing ]);

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
        console.log("NO COMPLETED DRAWINGS IN MULTIPLE DRAWINGS!!!!!!!!!!   ");
        // return null;
    }
    console.log({ completedDrawings });

    const renderDrawings = (reRenderIndex: number) => {
        return completedDrawings?.map((completedDrawing, index) => (
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
            {completedDrawings && completedDrawings.length > 1
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
