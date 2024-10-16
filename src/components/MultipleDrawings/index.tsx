import React, { useEffect, useRef } from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from "react-responsive-carousel";

import { useSocketInfo } from "../../context/SocketInfoProvider";
import { PANEL_HEIGHT, PANEL_WIDTH, drawOnCanvas } from "../../screens/Canvas";
import { title } from "./styles";
import { Point } from "../../types";

const CompletedDrawing = ({ completedDrawing }: { completedDrawing: Point[][][] }): JSX.Element | null => {
    if (completedDrawing?.length === 0) {
        return null;
    }

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        console.log("canvas truthy:", Boolean(canvas));
        console.log("context truthy:", Boolean(context));
        console.log("completed drawing in completedDrawing component", completedDrawing);

        const devicePixelRatio = window.devicePixelRatio ?? 1;
        console.log("before canvas not null");

        console.log("completedDrawing in CompletedDrawing:", completedDrawing);

        // Set canvas dimensions
        canvas.style.width = `${PANEL_WIDTH}px`;
        canvas.style.height = `${PANEL_HEIGHT * 3}px`;
        canvas.width = PANEL_WIDTH * devicePixelRatio;
        canvas.height = PANEL_HEIGHT * devicePixelRatio * 3;

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        let yOffset = 0;

        completedDrawing.forEach((strokeHistory) => {
            console.log(strokeHistory);
            // Redraw stroke history onto blank canvas
            strokeHistory.forEach((strokeArray) => drawOnCanvas(strokeArray, canvasRef, yOffset));
            yOffset += PANEL_HEIGHT;
        });
    }, [ completedDrawing ]);

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

const renderDrawings = (completedDrawings: Point[][][][] | null, reRenderIndex: number) => {
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
            <CompletedDrawing completedDrawing={completedDrawing} />
        </div>
    ));
};

function MultipleDrawings({ shouldAnimate }: { shouldAnimate: boolean }) {
    const [ reRender, setReRenderIndex ] = React.useState<number>(-1);
    const { completedDrawings } = useSocketInfo();
    if (!completedDrawings || completedDrawings?.length === 0) {
        console.log("NO COMPLETED DRAWINGS IN MULTIPLE DRAWINGS!!!!!!!!!!   ");
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
                        {renderDrawings(completedDrawings, reRender)}
                    </Carousel>
                )
                : (
                    renderDrawings(completedDrawings, reRender)
                )}
        </div>
    );
}

export default MultipleDrawings;
