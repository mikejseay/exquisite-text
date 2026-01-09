import * as React from "react";
import { InteractiveSketch } from "../../components/InteractiveSketch";

export default function TestSketch() {
    return (
        <InteractiveSketch
            initialModel="cat"
            initialTemperature={0.25}
            onModelLoaded={(name) => console.log(`Loaded: ${name}`)}
            onClear={() => console.log("Canvas cleared")}
        />
    );
}
