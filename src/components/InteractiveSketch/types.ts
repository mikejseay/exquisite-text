/**
 * Type definitions for the InteractiveSketch component
 */

// Re-export types from @magenta/sketch for convenience
export type { ModelState, ModelPDF, Point, RawLine, Stroke } from "@magenta/sketch";

// Pen state indices
export const PEN = {
    DOWN: 0,
    UP: 1,
    END: 2,
} as const;

export type PenStateIndex = typeof PEN[keyof typeof PEN];

// A pen state is a tuple of [pen_down, pen_up, pen_end]
export type PenState = [number, number, number];

// Props for the InteractiveSketch component
export interface InteractiveSketchProps {
    /** Initial model to load (default: 'cat') */
    initialModel?: string;
    /** Initial temperature value (default: 0.25) */
    initialTemperature?: number;
    /** Width of the canvas (default: auto based on container) */
    width?: number;
    /** Height of the canvas (default: half of window height) */
    height?: number;
    /** Pixel factor for model output scale (default: 5.0) */
    pixelFactor?: number;
    /** Callback when model finishes loading */
    onModelLoaded?: (modelName: string) => void;
    /** Callback when drawing is cleared */
    onClear?: () => void;
    /** Custom class name for the container */
    className?: string;
}

// Available models for SketchRNN
export const AVAILABLE_MODELS = [
    'bird', 'ant', 'ambulance', 'angel', 'alarm_clock', 'antyoga', 'backpack',
    'barn', 'basket', 'bear', 'bee', 'beeflower', 'bicycle', 'book', 'brain',
    'bridge', 'bulldozer', 'bus', 'butterfly', 'cactus', 'calendar', 'castle',
    'cat', 'catbus', 'catpig', 'chair', 'couch', 'crab', 'crabchair',
    'crabrabbitfacepig', 'cruise_ship', 'diving_board', 'dog', 'dogbunny',
    'dolphin', 'duck', 'elephant', 'elephantpig', 'everything', 'eye', 'face',
    'fan', 'fire_hydrant', 'firetruck', 'flamingo', 'flower', 'floweryoga',
    'frog', 'frogsofa', 'garden', 'hand', 'hedgeberry', 'hedgehog', 'helicopter',
    'kangaroo', 'key', 'lantern', 'lighthouse', 'lion', 'lionsheep', 'lobster',
    'map', 'mermaid', 'monapassport', 'monkey', 'mosquito', 'octopus', 'owl',
    'paintbrush', 'palm_tree', 'parrot', 'passport', 'peas', 'penguin', 'pig',
    'pigsheep', 'pineapple', 'pool', 'postcard', 'power_outlet', 'rabbit',
    'rabbitturtle', 'radio', 'radioface', 'rain', 'rhinoceros', 'rifle',
    'roller_coaster', 'sandwich', 'scorpion', 'sea_turtle', 'sheep', 'skull',
    'snail', 'snowflake', 'speedboat', 'spider', 'squirrel', 'steak', 'stove',
    'strawberry', 'swan', 'swing_set', 'the_mona_lisa', 'tiger', 'toothbrush',
    'toothpaste', 'tractor', 'trombone', 'truck', 'whale', 'windmill', 'yoga',
    'yogabicycle'
] as const;

export type AvailableModel = typeof AVAILABLE_MODELS[number];
