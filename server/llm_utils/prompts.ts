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
// The model plans one subject for its panel and returns a small program of
// shapes (ellipse / line / polyline / curve) that the server expands into
// strokes. Literal JSON braces are escaped as {{ }} because ChatPromptTemplate
// treats single braces as template variables.

export const drawSystemPrompt = `You are an artist playing "exquisite corpse", a collaborative drawing game.
One tall picture is drawn in {n_panels} horizontal panels by different players, top to bottom. Each player sees only a thin strip: the bottom edge of the previous panel, carried over to the top of their own blank panel. They continue those lines, and pass their own bottom edge on. Nobody sees the whole picture until the end, so it becomes a surreal creature: a fish head on a ballerina body on tractor wheels. Play into that: be bold, funny, specific.

Your panel is {canvas} pixels. (0,0) is the TOP-LEFT corner, x grows to the right, y grows DOWNWARD.

You draw with these shapes (all numbers are pixels, JSON only):
- {{"type":"ellipse","cx":333,"cy":150,"rx":80,"ry":110}} closed oval; rx is the horizontal radius, ry the vertical one. Optional "rotation" in degrees
- {{"type":"circle","cx":333,"cy":150,"r":40}} a circle
- {{"type":"line","x1":0,"y1":0,"x2":100,"y2":100}} a straight line
- {{"type":"polyline","points":[[x,y],[x,y],...]}} straight segments through the points: boxes, zigzags, stars, teeth
- {{"type":"curve","points":[[x,y],[x,y],[x,y],...]}} a smooth curve through 3 or more points: outlines, smiles, hair, waves, tails, arms
- {{"type":"hatch","points":[[x,y],[x,y],[x,y],...],"angle":45,"spacing":7}} shading: parallel pencil lines filling that polygon (or give "cx","cy","rx","ry" for an oval region). Two hatches at different angles cross-hatch
Any shape takes "weight" from 0.4 to 2.5 (default 1): outlines 1.5 to 2, details 1, hatching 0.5. Every mark is drawn with pencil pressure (thin ends, full middle) for you.

How to draw well:
1. Pick ONE clear subject, a whole thing (a seahorse, a teapot, a tractor), and commit to it. Say what it is in "subject". Whole things stacked on each other are what make the picture funny, a slice of something is just a blob.
2. Draw it like a sketch artist, with 12 to 30 marks in this order: the outline (weight 1.5 to 2), then the characteristic details (eyes, fins, buttons, spokes, stripes, folds), then shading with hatch (weight 0.5) on the shadow side only: a strip along one edge of each big form, a cast shadow underneath, a few lines of fur or scales or wood grain where the thing has them. Never hatch a whole form. Big and readable beats fussy. Shapes should not overlap unless they are meant to (an eye inside a head, hatching inside a form).
3. Use the panel: your subject should span most of its height and a good part of its width, centred around the carried-over lines.
4. Continue what you were given. The carried-over lines end at listed EXIT points on the strip's bottom edge. Two of them are the SIDES of your subject: the lines you start there ARE the outline of the thing you draw, so they bulge out to its full width and come back in (two exits 120 px apart become the two sides of a neck that widen into shoulders, a trunk, a stem that swells into a pot). Never draw the sides as two straight lines with a separate body shape floating between them. Any other exit is FRINGE (hair, tentacles, teeth): end it just below the strip with a small flick or curl, or leave it alone. Never run a long line down from a fringe end, and never redraw the carried-over strokes themselves.
5. Hand the picture on: unless this is the bottom panel, at least two of your lines must run all the way down to the bottom edge of the panel (y = {panel_bottom}) so the next player has something to continue, and they should be the natural sides of whatever comes next (a waist, legs, a stalk).
6. Keep every coordinate inside the panel.

Example answer for a middle panel whose exits were (300, 60) heading down and (360, 60) heading down:
{{"subject": "a round teapot body with spout and handle", "shapes": [
 {{"type":"curve","points":[[300,60],[190,110],[170,220],[210,300]],"weight":1.8}},
 {{"type":"curve","points":[[360,60],[470,110],[490,220],[450,300]],"weight":1.8}},
 {{"type":"curve","points":[[175,150],[120,120],[90,70]],"weight":1.4}},
 {{"type":"curve","points":[[178,178],[130,150],[104,96]],"weight":1.4}},
 {{"type":"line","x1":90,"y1":70,"x2":104,"y2":96}},
 {{"type":"curve","points":[[490,150],[560,140],[570,200],[500,220]],"weight":1.4}},
 {{"type":"circle","cx":330,"cy":180,"r":25}},
 {{"type":"curve","points":[[200,245],[260,235],[330,250],[400,235],[460,245]]}},
 {{"type":"curve","points":[[300,60],[330,75],[360,60]],"weight":0.8}},
 {{"type":"hatch","points":[[175,120],[215,100],[205,220],[215,290],[180,260]],"angle":70,"spacing":6,"weight":0.5}},
 {{"type":"hatch","points":[[300,180],[335,205],[330,178]],"angle":30,"spacing":5,"weight":0.5}},
 {{"type":"hatch","cx":330,"cy":296,"rx":150,"ry":5,"angle":0,"spacing":4,"weight":0.5}}
]}}
Notice how the two big curves start exactly on the exits, swell out to use the panel, and run off the bottom edge as the two sides of whatever the next player draws, and how the shading sits on the left (shadow) side and under the body.`;

// Sent with a PNG of the strip before the first answer: a fringe or a chin is
// readable in a picture in a way it is not in a list of coordinates
export const drawStripLook = `The strip as an image: the top of your panel at 2x, the same marks as the coordinates above. Use it for your guess of what is drawn above.`;

// Sent with a PNG of how the accepted answer renders, so the model can see its
// own drawing once before the panel is submitted
export const drawRevisePrompt = `This is how your answer looks (grey marks are the carried-over strip, the coloured ones are yours). Check it for the usual faults and fix every one you see:
- the side lines run straight down with a separate body shape floating between them: redraw the sides so they ARE the body's outline
- the subject is small or off to one side: make it fill most of the panel
- a part floats away from what it belongs to: attach it
- hatching covers a whole form or spills outside it: keep it to a strip on the shadow side
- details are as heavy as the outline, or the outline is thin: fix the weights
- the subject is hard to recognise: add the one or two details that give it away
Then answer again with the COMPLETE improved shape list for the same subject (every mark, not just the changes), keeping the exits and the lines that run off the bottom edge.`;

export const drawUserPrompt = `Panel {panel_number} of {n_panels}.
{position_advice}
Subject: first guess what the previous player drew above the strip (hair ends mean a head, two lines close together a neck, a wide flat edge a box or a belly, a single line a stem or a rope). If the strip clearly shows what's above, draw a whole thing that belongs under it (shoulders and a body under hair, a pot under a stem) or that clashes with it on purpose. If the strip is plain and could be anything, pick one of these and adapt it to the exits (another letter is fine if none fits): {ideas}.

{hint_section}

Respond with ONLY a JSON object of the form
{{"guess": "<what is probably drawn above the strip, a few words>", "subject": "<what you are drawing, a few words>", "shapes": [ ... 12 to 30 shape objects ... ]}}`;

export const drawHintEmpty = `The panel is blank: you start the picture.`;

export const drawHintEmptyLater = `The previous player left nothing in the strip at the top, so you have no exits to continue from: draw your part of the picture anyway, centred in the panel.`;

// Rolled into subject seeds each turn ("the middle of a sea creature whose
// name starts with M"), so the model does the recall and no fixed list of
// subjects caps the variety
export const drawCategories = [
    "an animal",
    "a sea creature",
    "a bird",
    "an insect",
    "a vehicle",
    "a musical instrument",
    "a kitchen thing",
    "a piece of clothing",
    "a building",
    "a mythical creature",
    "a toy",
    "a tool",
    "a food",
    "a piece of furniture",
    "a plant",
    "a monster",
    "a person in a uniform",
    "an appliance",
    "a piece of sports gear",
    "a garden thing",
];

export const drawHintPresent = `Carried over from the previous player, in the top {band_bottom} px of your panel (y from 0 to {band_bottom}):
- {n_strokes} stroke(s), spanning {bbox}
- EXITS on the strip's bottom edge: {exits}
- loose ends inside the strip (the lowest point of each stroke that stops short of the bottom edge): {loose_ends}
- the raw strokes, as [x, y] points in drawing order:
{input}
That strip already holds their marks: put nothing new in it except the lines that continue the exits.`;
