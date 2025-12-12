/**
 * Type declarations for @magenta/sketch
 * Based on the SketchRNN API
 */

declare module "@magenta/sketch" {
    export interface ModelState {
        c: Float32Array[];
        h: Float32Array[];
    }

    export interface ModelPDF {
        pi: Float32Array;
        muX: Float32Array;
        muY: Float32Array;
        sigmaX: Float32Array;
        sigmaY: Float32Array;
        corr: Float32Array;
        pen: Float32Array;
    }

    export type Point = [number, number];
    export type RawLine = Point[];
    export type Stroke = [number, number, number, number, number];

    export class SketchRNN {
        /**
         * Create a new SketchRNN instance
         * @param modelUrl URL to the model JSON file
         */
        constructor(modelUrl: string);

        /**
         * Initialize the model (async loading)
         */
        initialize(): Promise<void>;

        /**
         * Dispose of the model and free resources
         */
        dispose(): void;

        /**
         * Set the pixel scaling factor for output
         * @param factor Scale factor (default: 1.0)
         */
        setPixelFactor(factor: number): void;

        /**
         * Simplify a raw line using the RDP algorithm
         * @param line Array of [x, y] points
         * @param tolerance Simplification tolerance
         */
        simplifyLine(line: RawLine, tolerance?: number): RawLine;

        /**
         * Convert a line to stroke format
         * @param line Array of [x, y] points
         * @param lastPoint The last point before this line [x, y]
         */
        lineToStroke(line: RawLine, lastPoint: Point): Stroke[];

        /**
         * Get a zero-initialized model state
         */
        zeroState(): ModelState;

        /**
         * Get a zero-initialized input
         */
        zeroInput(): Stroke;

        /**
         * Update the model state with a new input
         * @param input The input stroke or array
         * @param state Current model state
         */
        update(input: Stroke | number[], state: ModelState): ModelState;

        /**
         * Update the model state with multiple strokes
         * @param strokes Array of strokes
         * @param state Current model state
         * @param steps Number of steps to process
         */
        updateStrokes(strokes: Stroke[], state: ModelState, steps: number): ModelState;

        /**
         * Copy a model state
         * @param state State to copy
         */
        copyState(state: ModelState): ModelState;

        /**
         * Get the probability distribution function from the model state
         * @param state Current model state
         * @param temperature Sampling temperature (0-1)
         */
        getPDF(state: ModelState, temperature: number): ModelPDF;

        /**
         * Sample a stroke from the probability distribution
         * @param pdf Probability distribution from getPDF
         */
        sample(pdf: ModelPDF): Stroke;
    }
}
