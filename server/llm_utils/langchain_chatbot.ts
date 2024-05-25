import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import * as dotenv from "dotenv";
import type { BaseMessage } from "@langchain/core/messages";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";

dotenv.config({ path: __dirname + "/../.env" });

async function mainOne() {

    // level 1: by default, the model does not remember anything from previous invocations
    const model: ChatOpenAI = new ChatOpenAI({ model: "gpt-4o" });
    const resultOne = await model.invoke(
        [ new HumanMessage({ content: "Hi! I'm Bob" }) ],
    );
    console.log({ resultOne });
    // Hello, Bob! How can I assist you today?
    const resultTwo = await model.invoke(
        [ new HumanMessage({ content: "What's my name?" }) ],
    );
    console.log({ resultTwo });
    // I don't have access to personal information about users, including their names.
    // How can I assist you today?

}

async function mainTwo() {

    // level 2: to get around this, we can pass the entire conversation history into the model
    const model: ChatOpenAI = new ChatOpenAI({ model: "gpt-4o" });

    const result = await model.invoke([
        new HumanMessage({ content: "Hi! I'm Bob" }),
        new AIMessage({ content: "Hello Bob! How can I assist you today?" }),
        new HumanMessage({ content: "What's my name?" }),
    ]);

    console.log({ result });
    // You mentioned that your name is Bob. How can I help you today?
}

async function mainThree() {

    // level 3: but the above approach is not the best practice
    // here is how you make all of this more standardized
    const model: ChatOpenAI = new ChatOpenAI({ model: "gpt-4o" });

    // first, let's initialize a global variable that will map between chat sessions
    // and objects that represent the chat message history
    const messageHistories: Record<string, InMemoryChatMessageHistory> = {};

    // next, let's make a prompt template that provides a system message telling the model to remember things,
    // the placeholder entry actually allows an input (chat_history) to be a *list* of messages,
    // and it expands the list to fill in the whole chat
    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            "You are a helpful assistant who remembers all details the user shares with you.",
        ],
        [ "placeholder", "{chat_history}" ],
        [ "human", "{input}" ],
    ]);
    const chain = prompt.pipe(model);

    // now we define withMessageHistory, a new "runnable" (like a new chain)
    // that combines the original chain (prompt -> model) with functionality for keeping track of chat history
    // the main one is a function that takes a session ID and returns a ChatMessageHistory
    // we also tell it which curly variables represent new input vs historical messages.
    // in this case, {input} is new human input and {chat_history} is the placeholder that provides chat history
    const withMessageHistory = new RunnableWithMessageHistory({
        runnable: chain,
        getMessageHistory: async (sessionId) => {
            if (messageHistories[sessionId] === undefined) {
                messageHistories[sessionId] = new InMemoryChatMessageHistory();
            }
            return messageHistories[sessionId];
        },
        inputMessagesKey: "input",
        historyMessagesKey: "chat_history",
    });

    // create a config object that keeps track of the session ID
    // withMessageHistory expects to receive this config
    const config = {
        configurable: {
            sessionId: "abc2",
        },
    };

    // here's how you invoke withMessageHistory
    const response = await withMessageHistory.invoke(
        {
            input: "Hi! I'm Bob",
        },
        config,
    );
    console.log("response", response.content);
    // Hi, Bob! How can I assist you today?

    const followupResponse = await withMessageHistory.invoke(
        {
            input: "What's my name?",
        },
        config,
    );
    console.log("followupResponse", followupResponse.content);
    // Your name is Bob. How can I help you, Bob?

    const configTwo = {
        configurable: {
            sessionId: "abc3",
        },
    };
    const newSessionResponse = await withMessageHistory.invoke(
        {
            input: "What's my name?",
        },
        configTwo,
    );
    console.log("newSessionResponse", newSessionResponse.content);
    // I'm sorry, but you haven't shared your name with me yet. Can you please tell me your name?

    const sameSessionResponse = await withMessageHistory.invoke(
        {
            input: "What's my name?",
        },
        config,
    );
    console.log("sameSessionResponse", sameSessionResponse.content);
    // Your name is Bob. How can I assist you today, Bob?
}

async function mainFour() {
    // level 4: limit the memory of the model to a certain number of messages
    // model, global to keep track of histories, and prompt are all the same
    const model: ChatOpenAI = new ChatOpenAI({ model: "gpt-4o" });
    const messageHistories: Record<string, InMemoryChatMessageHistory> = {};
    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            "You are a helpful assistant who remembers all details the user shares with you.",
        ],
        [ "placeholder", "{chat_history}" ],
        [ "human", "{input}" ],
    ]);

    // here's the new idea: we create a function that, given a Record that represents all the inputs
    // into the chat prompt template, can apply a function to part of those inputs. specifically,
    // we take the chat_history part (a list of messages) and slice the most recent 10 messages out of it
    const filterMessages = ({ chat_history }: Record<string, unknown>) => {
        return (chat_history as BaseMessage[]).slice(-10);
    };

    // here's how you add this function to the chain: you make a "runnable sequence" from a list.
    // the first element of the list is the result of the assign method of a "runnable passthrough"
    // the assign method assigns an input variable to a function and returns a new piece in the chain
    // the new piece takes "chat_history" and applies filterMessages, returning a shorter list of messages
    // as usual, the result goes into the prompt template, and then the model
    const chain = RunnableSequence.from([
        RunnablePassthrough.assign({
            chat_history: filterMessages,
        }),
        prompt,
        model,
    ]);

    // let's make up a history of chat messages
    const messages = [
        new HumanMessage({ content: "hi! I'm bob" }),               // 12
        new AIMessage({ content: "hi!" }),                          // 11
        new HumanMessage({ content: "I like vanilla ice cream" }),  // 10
        new AIMessage({ content: "nice" }),                         // 9
        new HumanMessage({ content: "whats 2 + 2" }),               // 8
        new AIMessage({ content: "4" }),                            // 7
        new HumanMessage({ content: "thanks" }),                    // 6
        new AIMessage({ content: "No problem!" }),                  // 5
        new HumanMessage({ content: "having fun?" }),               // 4
        new AIMessage({ content: "yes!" }),                         // 3
        new HumanMessage({ content: "That's great!" }),             // 2
        new AIMessage({ content: "yes it is!" }),                   // 1
    ];

    // "chain" now clips message history; the bot can't remember more than 10 messages back
    const responseOne = await chain.invoke({
        chat_history: messages,
        input: "what's my name?",
    });
    console.log("responseOne", responseOne.content);
    // You haven't shared your name with me yet. What is your name?

    const responseTwo = await chain.invoke({
        chat_history: messages,
        input: "what's my fav ice cream",
    });
    console.log("responseTwo", responseTwo.content);
    // Your favorite ice cream is vanilla.

    // now we can put this chain back into our runnable that keeps track of message history normally
    // this way we can build up a history organically through repeated interactions in the same session
    // to test our history clipper, we hack in our 12 message dialog from above into the history
    // "withMessageHistory" becomes the new chain
    const withMessageHistory = new RunnableWithMessageHistory({
        runnable: chain,
        getMessageHistory: async (sessionId) => {
            if (messageHistories[sessionId] === undefined) {
                const messageHistory = new InMemoryChatMessageHistory();
                // hack the 12 message dialog into the history
                await messageHistory.addMessages(messages);
                messageHistories[sessionId] = messageHistory;
            }
            return messageHistories[sessionId];
        },
        inputMessagesKey: "input",
        historyMessagesKey: "chat_history",
    });

    // initialize a new session
    const config = {
        configurable: {
            sessionId: "abc4",
        },
    };
    const responseThree = await withMessageHistory.invoke(
        {
            input: "what's my name?",
        },
        config,
    );
    console.log("responseThree", responseThree.content);
    // You haven’t told me your name yet. What is your name?

    // now, since we just added another pair of messages into the history (for a total of 14)
    // the message with the info about the favorite ice cream falls out of short-term memory
    const responseFour = await withMessageHistory.invoke(
        {
            input: "whats my favorite ice cream?",
        },
        config,
    );
    console.log("responseFour", responseFour.content);
    // You haven't mentioned your favorite ice cream yet. What's your favorite flavor?
}

mainFour();
