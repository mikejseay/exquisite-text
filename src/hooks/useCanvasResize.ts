import { useLayoutEffect, useRef, useState } from "react";
import { debounce } from "es-toolkit";

import { logger } from "../utilities/loggerUtils";
import { aboveCanvasHeight } from "../constants";

export function useCanvasResize(
    widthMin: number,
    heightMin: number,
    aspectRatio: number,
) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [ dimensions, setDimensions ] = useState({ width: widthMin, height: heightMin });
    const [ scaleFactor, setScaleFactor ] = useState<number>(1);

    useLayoutEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const context = canvas.getContext("2d");
            if (!context) return;

            const viewportHeight = window.innerHeight - aboveCanvasHeight;
            const viewportWidth = window.innerWidth;
            const viewportAspectRatio = viewportWidth / viewportHeight;
            let newWidth: number;
            let newHeight: number;

            if (viewportAspectRatio < aspectRatio) {
                logger.debug("viewportAspectRatio < aspectRatio");
                newWidth = Math.max(viewportWidth, widthMin);
                newHeight = Math.max(newWidth / aspectRatio, heightMin);
            } else {
                logger.debug("viewportAspectRatio >= aspectRatio");
                newHeight = Math.max(viewportHeight, heightMin);
                newWidth = Math.max(newHeight * aspectRatio, widthMin);
            }

            const newScaleFactor = newWidth / widthMin;
            logger.debug(`New Scale Factor: ${newScaleFactor}`);

            setDimensions({ width: newWidth, height: newHeight });
            setScaleFactor(newScaleFactor);
        };

        const debouncedHandleResize = debounce(() => {
            logger.debug("Debounced handle resize");
            handleResize();
        }, 200);

        handleResize();
        window.addEventListener("resize", debouncedHandleResize);

        return () => {
            debouncedHandleResize.cancel();
            window.removeEventListener("resize", debouncedHandleResize);
        };
    }, []);

    return { canvasRef, dimensions, scaleFactor };
}
