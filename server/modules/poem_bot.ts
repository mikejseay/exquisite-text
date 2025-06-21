import { ChatOpenAI } from "@langchain/openai";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import * as dotenv from "dotenv";
import { botDeviceIDToMessageHistory } from "./globals";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { analyzeSystemPrompt, analyzeUserPrompt, completeSystemPrompt, completeUserPrompt } from "../llm_utils/prompts";
import { IGameSettingsInfo } from "../../src/types";
import { lineConstraints } from "../../src/constants";
import { canBeFixedByShifting, isAcceptableShape, processPoetryLines } from "../llm_utils/llm_funcs";

dotenv.config({ path: __dirname + "/../.env" });

const analyzePoetryPrompt = ChatPromptTemplate.fromMessages([
    [ "system", analyzeSystemPrompt ],
    [ "human", analyzeUserPrompt ],
]);
const completePoetryPrompt = ChatPromptTemplate.fromMessages([
    [ "system", completeSystemPrompt ],
    [ "placeholder", "{chat_history}" ],
    [ "human", completeUserPrompt ],
]);
const modelHighTemp: ChatOpenAI = new ChatOpenAI({ model: "gpt-4o" , temperature: 1.4 });
const parser = new StringOutputParser();

const analyzePoetryChain = analyzePoetryPrompt.pipe(modelHighTemp).pipe(parser);
const completePoetryChain = new RunnableWithMessageHistory({
    runnable: completePoetryPrompt.pipe(modelHighTemp).pipe(parser),
    getMessageHistory: async (sessionId) => {
        // BTW this logic is so dope for initializing entries into global maps
        if (botDeviceIDToMessageHistory[sessionId] === undefined) {
            botDeviceIDToMessageHistory[sessionId] = new InMemoryChatMessageHistory();
        }
        return botDeviceIDToMessageHistory[sessionId];
    },
    inputMessagesKey: "input",
    historyMessagesKey: "chat_history",
});

export async function analyzeBeginning(poemStart: string) {
    console.log("analyzing poemStart", poemStart);

    // this is a one-off analysis that will be attached to the poem itself
    const analysis = await analyzePoetryChain.invoke({ poem_start: poemStart });
    console.log(analysis);

    return analysis;
}

export async function guaranteeHalfLineCompletion(
    botDeviceID: string,
    halfLine: string,
    gameSettings: IGameSettingsInfo,
    forceIncomplete: boolean, // whether to force the AI to leave second line incomplete
    poemAnalysis: string, // an analysis of the poem to provide
) {

    const lineLength = gameSettings.lineLength;
    const nWordsFirst = lineConstraints[lineLength].idealWordsOnLineOne;
    const nWordsSecondInit = lineConstraints[lineLength].idealWordsOnLineTwo;
    const nCharsFirst = lineConstraints[lineLength].idealCharsOnLineOne;
    const nCharsSecond = lineConstraints[lineLength].idealCharsOnLineTwo;

    // forceIncomplete is intended to force an unresolved ending of the AI's completion
    // we ask it to double the number of words on the second line, then clip the extra words off

    // this while loop wrapper implements a "retry" mechanism to make sure the completion is at least two lines
    let validInput = false;
    let partsFinal;
    let nTries = 0;
    while (!validInput && nTries < 5) {
        const nWordsSecond = (forceIncomplete
            ? (nWordsSecondInit * 2)
            : nWordsSecondInit);
        console.log({
            botDeviceID: botDeviceID,
            halfLine: halfLine,
            gameSettings: gameSettings,
            nWordsFirst: nWordsFirst,
            nWordsSecond: nWordsSecond,
            poemAnalysis: poemAnalysis,
        });
        const completion = await completeHalfLine(
            botDeviceID,
            halfLine,
            nWordsFirst,
            nWordsSecond,
            poemAnalysis,
        );
        nTries += 1;
        console.log("original completion:\n", completion);
        const parts = completion.split("\n");
        if (parts.length < 2) {
            console.log("completion had fewer than 2 lines, retrying.");
        } else {
            validInput = true;
            // if we wanted to force an incomplete second line, clip it to the original requested # of words
            if (isAcceptableShape(parts[0], parts[1], nCharsFirst, nCharsSecond, forceIncomplete)) {
                partsFinal = parts;
            } else if (canBeFixedByShifting(parts[0], parts[1], nCharsFirst, nCharsSecond)) {
                partsFinal = processPoetryLines(parts[0], parts[1]);
            } else {
                partsFinal = parts;
                validInput = false;
                console.log("completion was neither an acceptable shape nor could be fixed by shifting, retrying");
            }
            if (forceIncomplete) {
                partsFinal[1] = partsFinal[1].split(" ").slice(0, nWordsSecondInit).join(" ");
            }
        }
    }
    if (!partsFinal) {
        throw new Error("undefined partsFinal.");
    }
    console.log(partsFinal);
    return partsFinal;
}

export async function completeHalfLine(
    botDeviceID: string,
    halfLine: string,
    nFirst: number, // number of words on first line
    nSecond: number, // number of words on second line
    poemAnalysis: string, // an analysis of the poem to provide
) {
    // each bot device ID gets its own session (shared across poems)
    const config = { configurable: { sessionId: botDeviceID } };
    return await completePoetryChain.invoke(
        {
            poem_analysis: poemAnalysis,
            n_first: nFirst.toString(),
            n_second: nSecond.toString(),
            input: halfLine,
        },
        config,
    );
}
