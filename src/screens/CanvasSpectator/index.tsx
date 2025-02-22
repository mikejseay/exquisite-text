// src/screens/CanvasSpectator/index.tsx
import React, { useEffect, useState } from "react";
import { useSocketInfo } from "../../context/SocketInfoProvider";
import { Point } from "../../types";
import MultipleDrawings from "../../components/MultipleDrawings";

const CanvasSpectator: React.FC = () => {
    const { panels, panelEdits, nDrawings  } = useSocketInfo();
    const [ completedDrawings, setCompletedDrawings ] = useState<Point[][][][]>([]);

    useEffect(() => {
        if (!nDrawings) return;
        console.log({ panels, panelEdits });
        // Levels //
        // Outer: Drawings
        // Panels
        // Strokes
        // Points

        const combinedPanelsAndPanelEdits: Point[][][][] = [];

        for (let drawingIndex = 0; drawingIndex < nDrawings; drawingIndex++) {
            const currentPanels: Point[][][] = [];

            if (panels && panels[drawingIndex]) {
            // panels[drawingIndex] is Point[][][]
            // "Extending" currentPanels by pushing all panels for this drawing
                currentPanels.push(...panels[drawingIndex]);
            }

            if (panelEdits && panelEdits[drawingIndex]) {
            // panelEdits[drawingIndex] is Point[][]
            // Appending the panel edits for this drawing
                currentPanels.push(panelEdits[drawingIndex]);
            }

            combinedPanelsAndPanelEdits.push(currentPanels);
        }
        setCompletedDrawings(combinedPanelsAndPanelEdits);

    }, [ panels, panelEdits, nDrawings ]);

    return (
        <MultipleDrawings completedDrawings={completedDrawings} shouldAnimate={false} />
    );
};



export default CanvasSpectator;
