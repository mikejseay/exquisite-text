import { RefObject, useLayoutEffect, useRef, useState } from "react";
import { debounce } from "es-toolkit";

import { logger } from "../utilities/loggerUtils";
import { headerHeight } from "../constants";

export function useCanvasResize(
    widthMin: number,
    heightMin: number,
    aspectRatio: number,
    toolbarRef?: RefObject<HTMLDivElement | null>,
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

            const aboveCanvas = toolbarRef?.current
                ? toolbarRef.current.getBoundingClientRect().bottom
                : headerHeight;

            const viewportHeight = window.innerHeight - aboveCanvas;
            const viewportWidth = window.innerWidth;
            const viewportAspectRatio = viewportWidth / viewportHeight;
            let newWidth: number;
            let newHeight: number;

            if (viewportAspectRatio < aspectRatio) {
                logger.debug("viewportAspectRatio < aspectRatio");
                // Width-constrained: fit to viewport width, allow shrinking below min
                newWidth = viewportWidth;
                newHeight = newWidth / aspectRatio;
            } else {
                logger.debug("viewportAspectRatio >= aspectRatio");
                // Height-constrained: fit to viewport height, allow shrinking below min
                newHeight = viewportHeight;
                newWidth = newHeight * aspectRatio;
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

        // Watch for toolbar height changes (e.g. wrapping on narrow screens)
        let resizeObserver: ResizeObserver | undefined;
        if (toolbarRef?.current) {
            resizeObserver = new ResizeObserver(debouncedHandleResize);
            resizeObserver.observe(toolbarRef.current);
        }

        return () => {
            debouncedHandleResize.cancel();
            window.removeEventListener("resize", debouncedHandleResize);
            resizeObserver?.disconnect();
        };
    }, []);

    return { canvasRef, dimensions, scaleFactor };
}
