import { ChatOpenAI } from "@langchain/openai";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import * as dotenv from "dotenv";
import { botDeviceIDToMessageHistory } from "./globals";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { analyzeSystemPrompt, analyzeUserPrompt, completeSystemPrompt, completeUserPrompt } from "../llm_utils/prompts";

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
const model: ChatOpenAI = new ChatOpenAI({ model: "gpt-4o" });
const parser = new StringOutputParser();

const analyzePoetryChain = analyzePoetryPrompt.pipe(model).pipe(parser);
const completePoetryChain = new RunnableWithMessageHistory({
    runnable: completePoetryPrompt.pipe(model).pipe(parser),
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
    nFirst: number, // number of words on first line
    nSecond: number, // number of words on second line
    forceIncomplete: boolean, // whether to force the AI to leave second line incomplete
    poemAnalysis: string, // an analysis of the poem to provide
) {

    console.log({
        botDeviceID: botDeviceID,
        halfLine: halfLine,
        nFirst: nFirst,
        nSecond: nSecond,
        forceIncomplete: forceIncomplete,
        poemAnalysis: poemAnalysis,
    });

    // forceIncomplete is intended to force an unresolved ending of the AI's completion
    // we ask it to double the number of words on the second line, then clip the extra words off
    let nSecondGiven;
    if (forceIncomplete) {
        nSecondGiven = nSecond * 2;
    } else {
        nSecondGiven = nSecond;
    }

    // this while loop wrapper implements a "retry" mechanism to make sure the completion is at least two lines
    let validInput = false;
    let completion;
    while (!validInput) {
        completion = await completeHalfLine(botDeviceID, halfLine, nFirst, nSecondGiven, forceIncomplete, poemAnalysis);
        if (completion.split("\n").length >= 2) {
            validInput = true;
        } else {
            console.log("completion had fewer than 2 lines, retrying.");
        }
    }
    if (!completion) {
        throw new Error("undefined completion.");
    }
    const parts = completion.split("\n");

    // if we wanted to force an incomplete second line, clip it to the original request # of words
    if (forceIncomplete) {
        parts[1] = parts[1].split(" ").slice(0, nSecond).join(" ");
    }

    return parts;
}

export async function completeHalfLine(
    botDeviceID: string,
    halfLine: string,
    nFirst: number, // number of words on first line
    nSecond: number, // number of words on second line
    forceIncomplete: boolean, // whether to force the AI to leave second line incomplete
    poemAnalysis: string, // an analysis of the poem to provide
) {
    // each bot device ID gets its own session (shared across poems)
    const config = { configurable: { sessionId: botDeviceID } };
    const completion = await completePoetryChain.invoke(
        {
            poem_analysis: poemAnalysis,
            n_first: nFirst.toString(),
            n_second: nSecond.toString(),
            input: halfLine,
        },
        config,
    );
    console.log(completion);

    return completion;
}
