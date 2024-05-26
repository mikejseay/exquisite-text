import { ChatOpenAI } from "@langchain/openai";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import * as dotenv from "dotenv";
import { botDeviceIDToMessageHistory } from "./globals";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { systemPrompt } from "../llm_utils/prompts";

dotenv.config({ path: __dirname + "/../.env" });

const prompt = ChatPromptTemplate.fromMessages([
    [ "system", systemPrompt ],
    [ "placeholder", "{chat_history}" ],
    [ "human", "{input}" ],
]);
const model: ChatOpenAI = new ChatOpenAI({ model: "gpt-4o" });
const parser = new StringOutputParser();
const chain = prompt.pipe(model).pipe(parser);

const withMessageHistory = new RunnableWithMessageHistory({
    runnable: chain,
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

export async function completeHalfLine(botDeviceID: string, halfLine: string) {

    console.log("botDeviceID", botDeviceID, "being given input halfLine", halfLine);

    // each bot device ID gets its own session (shared across poems)
    const config = { configurable: { sessionId: botDeviceID } };
    const response = await withMessageHistory.invoke({ input: halfLine }, config);
    console.log(response);

    return response;
}
