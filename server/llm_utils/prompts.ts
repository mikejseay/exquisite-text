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

How to draw well:
1. Pick ONE clear subject that fits this panel's position in the picture (given below) and commit to it. Say what it is in "subject".
2. Draw it with 6 to 14 shapes: big outline shapes first, then a few characteristic details (eyes, fins, buttons, spokes, stripes). Big and readable beats fussy. Shapes should not overlap unless they are meant to (an eye inside a head).
3. Use the panel: your subject should span most of its height and a good part of its width, centred around the carried-over lines.
4. Continue what you were given. The carried-over lines end at listed EXIT points on the strip's bottom edge. Two of them are the SIDES of your subject: grow your outline downward from exactly those points, so two exits 120 px apart become the two sides of a neck, a trunk, a stem. Any other exit is FRINGE (hair, tentacles, teeth): end it just below the strip with a small flick or curl, or leave it alone. Never run a long line down from a fringe end, and never redraw the carried-over strokes themselves.
5. Hand the picture on: unless this is the bottom panel, at least two of your lines must run all the way down to the bottom edge of the panel (y = {panel_bottom}) so the next player has something to continue, and they should be the natural sides of whatever comes next (a waist, legs, a stalk).
6. Keep every coordinate inside the panel.

Example answer for a middle panel whose exits were (300, 60) heading down and (360, 60) heading down:
{{"subject": "a round teapot body with spout and handle", "shapes": [
 {{"type":"curve","points":[[300,60],[190,110],[170,220],[210,300]]}},
 {{"type":"curve","points":[[360,60],[470,110],[490,220],[450,300]]}},
 {{"type":"curve","points":[[175,150],[120,120],[90,70]]}},
 {{"type":"curve","points":[[178,178],[130,150],[104,96]]}},
 {{"type":"line","x1":90,"y1":70,"x2":104,"y2":96}},
 {{"type":"curve","points":[[490,150],[560,140],[570,200],[500,220]]}},
 {{"type":"circle","cx":330,"cy":180,"r":25}},
 {{"type":"curve","points":[[200,245],[260,235],[330,250],[400,235],[460,245]]}}
]}}
Notice how the two big curves start exactly on the exits, swell out to use the panel, and run off the bottom edge as the two sides of whatever the next player draws.`;

export const drawUserPrompt = `Panel {panel_number} of {n_panels}: the {position} of the picture.
{position_advice}
Subject: pick one of these and adapt it to the exits, or something else only if it fits the exits better: {ideas}.

{hint_section}

Respond with ONLY a JSON object of the form
{{"subject": "<what you are drawing, a few words>", "shapes": [ ... 6 to 14 shape objects ... ]}}`;

export const drawHintEmpty = `The panel is blank: you start the picture.`;

export const drawHintEmptyLater = `The previous player left nothing in the strip at the top, so you have no exits to continue from: draw your part of the picture anyway, centred in the panel.`;

// A few of these are offered at random each turn so consecutive games do not
// all start with the same head
export const drawIdeas = {
    top: [
        "a pirate's head with an eyepatch",
        "a lighthouse top with its lamp",
        "a cat wearing a crown",
        "an astronaut helmet",
        "a fish head with big lips",
        "a robot head with antennae",
        "a wizard hat and beard",
        "a sunflower",
        "an owl with huge eyes",
        "a knight's helmet with a plume",
        "a teapot lid and steam",
        "a hot air balloon",
        "a vampire with a widow's peak",
        "a snail's shell and eyestalks",
        "a birthday cake with candles",
        "a chef's hat over a moustache",
    ],
    middle: [
        "a torso in a spacesuit",
        "a ballerina's tutu",
        "a car body with doors",
        "a barrel with hoops",
        "a superhero chest with a logo",
        "an octopus body with tentacle roots",
        "a tuxedo with a bow tie",
        "a tree trunk with a knot hole",
        "a wrestler's belt and muscles",
        "an accordion",
        "a guitar body",
        "a teapot with spout and handle",
        "a hoodie with a pocket",
        "a beetle's shell with spots",
        "a cactus with arms",
        "a wooden crate",
    ],
    bottom: [
        "ballet shoes en pointe",
        "tractor wheels",
        "flippers on a surfboard",
        "tree roots gripping the ground",
        "a mermaid tail",
        "roller skates",
        "octopus tentacles",
        "clown shoes",
        "a rocket's fins and flame",
        "elephant feet",
        "a skateboard",
        "high heels on a red carpet",
        "a snake's coiled tail",
        "chicken legs",
        "a pedestal with a plaque",
        "a puddle with ripples",
    ],
};

export const drawHintPresent = `Carried over from the previous player, in the top {band_bottom} px of your panel (y from 0 to {band_bottom}):
- {n_strokes} stroke(s), spanning {bbox}
- EXITS on the strip's bottom edge: {exits}
- loose ends inside the strip (the lowest point of each stroke that stops short of the bottom edge): {loose_ends}
- the raw strokes, as [x, y] points in drawing order:
{input}
That strip already holds their marks: put nothing new in it except the lines that continue the exits.`;
