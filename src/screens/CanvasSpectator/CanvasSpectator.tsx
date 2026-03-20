// src/screens/CanvasSpectator/index.tsx

import MultipleDrawings from "components/MultipleDrawings/MultipleDrawings";
import { useSocketInfo } from "context/SocketInfoProvider";
import type React from "react";
import { useEffect, useState } from "react";
import type { IPanel, Point } from "types/types";
import { logger } from "utilities/loggerUtils";

export function combineDrawingPanels(
    panels: Array<Array<IPanel["content"]>> | null,
    panelEdits: Array<IPanel["content"]> | null,
    nDrawings: number,
): Point[][][][] {
    const combined: Point[][][][] = [];

    for (let drawingIndex = 0; drawingIndex < nDrawings; drawingIndex++) {
        const currentPanels: Point[][][] = [];

        if (panels?.[drawingIndex]) {
            currentPanels.push(...panels[drawingIndex]);
        }

        if (panelEdits?.[drawingIndex] && panelEdits[drawingIndex].length > 0) {
            currentPanels.push(panelEdits[drawingIndex]);
        }

        combined.push(currentPanels);
    }
    return combined;
}

const CanvasSpectator: React.FC = () => {
    const { panels, panelEdits, nDrawings } = useSocketInfo();
    const [currentDrawings, setCurrentDrawings] = useState<Point[][][][]>([]);

    useEffect(() => {
        if (!nDrawings) return;
        logger.debug({ panels, panelEdits });
        setCurrentDrawings(combineDrawingPanels(panels, panelEdits, nDrawings));
    }, [panels, panelEdits, nDrawings]);

    return <MultipleDrawings completedDrawings={currentDrawings} shouldAnimate={false} />;
};

export default CanvasSpectator;
