export const analyzeSystemPrompt = "As a literary analyst, your task is to analyze the beginning of a poem and predict key aspects of its content.";

export const analyzeUserPrompt = `Analyze the beginning of this poem and predict what the poem will be about.
Provide a concise statement discussing the narrator, characters, setting, tone, diction, and/or imagery, where applicable.
Do not directly quote the input poetry in your response.
Your response should be one hundred words at most.
The first two lines of the poem can be found below, surrounded by input tags.
<input>{poem_start}</input>`;

export const completeSystemPrompt = `As a poet, your task is to continue a poetic narrative.
You should use the following analysis of the poem to guide your approach:
{poem_analysis}`;

export const completeUserPrompt = `Complete this snippet of poetry.
Your response must be exactly two lines.
Your response must always begin with the input snippet.
The first line of your response should be about {n_first} words.
The second line of your response should be about {n_second} words.
<input>{input}</input>`;
