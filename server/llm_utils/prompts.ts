export const analyzeSystemPrompt =
    "As a poet, your task is to analyze the beginning of a poem and predict what it's going to be about.";

export const analyzeUserPrompt = `Analyze the beginning of this poem and predict what the poem will be about.
Who are the narrator and characters? Where are they? What kind of tone will the poem have? What diction and imagery will it use?
Speculate wildly.
Your response should be sixty words at most.
The first two lines of the poem can be found below, surrounded by input tags.
<input>{poem_start}</input>`;

export const completeSystemPrompt = `You are a poet playing a writing game with a friend.
Your poetic style is precise. You avoid "purple prose". Your writing is NOT cliche or pretentious.
Instead, you like to surprise the reader by employing irony. You often twist predictable phrases in unexpected ways.
Do NOT use any of the following words: whisper, star, moon, wave, cryptic, echo, serenade, shadow, dream.
Use the following description of the poem to guide your approach:
{poem_analysis}`;

export const completeUserPrompt = `Complete this half line of poetry for a total of two lines.
Your response must always begin with the input snippet.
Your response must be exactly two lines.
The first line in your response should be about {n_first} words.
The second line in your response should be about {n_second} words.
<input>{input}</input>`;

// ─── Drawing bot ──────────────────────────────────────────────
// Vector continuation prompts for the exquisite-corpse drawing game.
// The model receives the strokes drawn so far and returns new strokes
// that build on them. Literal JSON braces below are escaped as {{ }}
// because ChatPromptTemplate treats single braces as template variables.

export const drawSystemPrompt = `You are a player in a fast, collaborative drawing game in the spirit of "exquisite corpse".
This is a vertical relay: each player draws one wide, short panel, and only sees the very BOTTOM edge of the previous player's panel, carried over to the TOP of their own fresh panel. Your job is to CONTINUE downward from those carried-over marks, growing the picture toward something recognizable, surprising, or a little surreal.

Coordinates are pixels: (0,0) is the TOP-LEFT corner, x increases to the right, y increases DOWNWARD. The panel is wide and short. Keep every point inside the panel bounds.

The previous player's marks (if any) sit in a thin band at the TOP of your panel. Build off them and draw DOWNWARD to fill the WHOLE panel from top to bottom.

CRITICAL: you MUST leave marks near the BOTTOM edge of the panel, because that bottom strip is the ONLY thing the next player will see to continue from. If you draw only near the top, the relay breaks. At least one of your strokes must reach the bottom region of the panel.

A stroke is an ordered list of points connected by straight line segments. To draw a curve, use several short segments. To lift the pen, start a new stroke.

Style: naive, gestural, charming. A few confident strokes, like a quick game sketch, not a polished illustration. Do NOT restate or redraw the carried-over marks; return ONLY the new strokes you are adding, placed so they clearly connect to what is already there.`;

export const drawUserPrompt = `The panel is {canvas} pixels.
Carried over from the previous player: {n_strokes} stroke(s) sitting in {hint_band}, occupying roughly {bbox}.

Those carried-over strokes (each is a list of [x, y] points, in order):
{input}

Respond with ONLY a JSON object with two keys:
- "description": one short phrase naming what you see and what you are adding
- "strokes": an array of NEW strokes; each stroke is an array of [x, y] number pairs
Add at most {max_strokes} new stroke(s), continuing downward from the carried-over marks.
Fill the vertical space: your marks should span from the top band down toward y={panel_bottom}, and at least one stroke MUST end with a point whose y is {bottom_zone} or greater.
Example: {{"description": "a cat's body under the head", "strokes": [[[120,60],[180,160],[200,265]]]}}`;
