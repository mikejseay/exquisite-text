import { ChatOpenAI } from "@langchain/openai";
import type { BaseMessage } from "@langchain/core/messages";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnablePassthrough, RunnableSequence, RunnableWithMessageHistory } from "@langchain/core/runnables";
import { logger } from "utilities/loggerUtils";

async function mainOne() {

    // level 1: by default, the model does not remember anything from previous invocations
    const model: ChatOpenAI = new ChatOpenAI({ model: "gpt-4o" });
    const resultOne = await model.invoke(
        [ new HumanMessage({ content: "Hi! I'm Bob" }) ],
    );
    logger.debug({ resultOne });
    // Hello, Bob! How can I assist you today?
    const resultTwo = await model.invoke(
        [ new HumanMessage({ content: "What's my name?" }) ],
    );
    logger.debug({ resultTwo });
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

    logger.debug({ result });
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
        [ "system", "You are a helpful assistant who remembers all details the user shares with you." ],
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
            // BTW this logic is so dope for initializing entries into global maps
            if (messageHistories[sessionId] === undefined) {
                messageHistories[sessionId] = new InMemoryChatMessageHistory();
            }
            return messageHistories[sessionId];
        },
        inputMessagesKey: "input",
        historyMessagesKey: "chat_history",
    });

    // in preparation of using our new chain that now automatically keeps track of chat history,
    // we must create a config object that keeps track of the session ID
    const config = { configurable: { sessionId: "abc2" } };

    // invoke new chain with input object and config as args
    const response = await withMessageHistory.invoke({ input: "Hi! I'm Bob" }, config);
    logger.debug(`response ${response.content}`);
    // Hi, Bob! How can I assist you today?

    // use the chain again, and it automatically keeps track of history
    const followupResponse = await withMessageHistory.invoke({ input: "What's my name?" }, config);
    logger.debug(`followupResponse ${followupResponse.content}`);
    // Your name is Bob. How can I help you, Bob?

    // let's make a new session by making a new config
    // if you make a new session, you get a new history
    const configTwo = { configurable: { sessionId: "abc3" } };
    const newSessionResponse = await withMessageHistory.invoke({ input: "What's my name?" }, configTwo);
    logger.debug(`newSessionResponse ${newSessionResponse.content}`);
    // I'm sorry, but you haven't shared your name with me yet. Can you please tell me your name?

    // upon re-using the first config, we can see that it retains a separate history
    const sameSessionResponse = await withMessageHistory.invoke({ input: "What's my name, again?" }, config);
    logger.debug(`sameSessionResponse ${sameSessionResponse.content}`);
    // Your name is Bob. How can I assist you today, Bob?
}

async function mainFour() {
    // level 4: limit the memory of the model to a certain number of messages

    // re-declare the model
    const model: ChatOpenAI = new ChatOpenAI({ model: "gpt-4o" });
    // global to keep track of histories
    const messageHistories: Record<string, InMemoryChatMessageHistory> = {};
    // and prompt (same as last time)
    const prompt = ChatPromptTemplate.fromMessages([
        [ "system", "You are a helpful assistant who remembers all details the user shares with you." ],
        [ "placeholder", "{chat_history}" ],
        [ "human", "{input}" ],
    ]);

    // here's the new idea: we create a function that, given a Record that represents all the inputs
    // into the chat prompt template, can apply a function to part of those inputs. specifically,
    // we take the chat_history part (a list of messages) and slice the most recent 10 messages out of it
    // NOTE: I HAD TO MODIFY TYPES TO GET THIS TO WORK

    // ORIGINAL FUNCTION FROM TUTORIAL
    // const filterMessages = ({ chat_history }: { chat_history: BaseMessage[] }) => {
    //     return chat_history.slice(-10);
    // };

    // WORKING FUNCTION WITH MODIFIED TYPES
    const filterMessages = ({ chat_history }: Record<string, unknown>) => {
        return (chat_history as BaseMessage[]).slice(-10);
    };

    // to incorporate this function, we represent the chain as a list with these items:
    // 1) a "runnable passthrough assignment" object that applies the function to part of the input
    // 2) our prompt template
    // 3) the LLM model

    // here's the syntax for creating the "runnable passthrough assignment"
    // the assign method takes an object that maps a variable in the input to a function
    // here, we apply filterMessages to "chat_history", returning a shorter list of messages
    const passThroughAssignment = RunnablePassthrough.assign({ chat_history: filterMessages });

    // here's the syntax for creating the new chain that contains the pass through assignment
    // specifically, we create a "runnable sequence" and use its "from" method
    // which takes the list of components in our chain
    const chain = RunnableSequence.from([
        passThroughAssignment,
        prompt,
        model,
    ]);

    // now we're ready to use an automatically-clipped chat history
    // to demonstrate, let's make up a long history of 12 chat messages
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

    // the first question refers to chat history 12 messages back, so the bot can't remember
    const responseOne = await chain.invoke({ chat_history: messages, input: "what's my name?" });
    logger.debug(`responseOne ${responseOne.content}`);
    // You haven't shared your name with me yet. What is your name?

    // the second question refers to chat history 10 messages back, so the bot can remember
    const responseTwo = await chain.invoke({ chat_history: messages, input: "what's my fav ice cream" });
    logger.debug(`responseTwo ${responseTwo.content}`);
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
    const config = { configurable: { sessionId: "abc4" } };
    const responseThree = await withMessageHistory.invoke({ input: "what's my name?" }, config);
    logger.debug(`responseThree ${responseThree.content}`);
    // You haven’t told me your name yet. What is your name?

    // now, since we just added another pair of messages into the history (for a total of 14)
    // the message with the info about the favorite ice cream falls out of short-term memory
    const responseFour = await withMessageHistory.invoke({ input: "whats my favorite ice cream?" }, config);
    logger.debug(`responseFour ${responseFour.content}`);
    // You haven't mentioned your favorite ice cream yet. What's your favorite flavor?
}

mainFour();
