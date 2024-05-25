import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import * as dotenv from "dotenv";

dotenv.config({ path: __dirname + "/../.env" });

async function main() {

    // create a parser
    const parser = new StringOutputParser();

    // instantiate model
    const model: ChatOpenAI = new ChatOpenAI({ model: "gpt-4o" });

    // level 1: define messages by hand and pass into model
    // result contains lots of metadata including the text output
    const messages = [
        new SystemMessage("Translate the following from English into Italian"),
        new HumanMessage("hi!"),
    ];
    const result = await model.invoke(messages);
    console.log({ result });

    // apply parser to raw result to get just the text output
    const parsedResult = await parser.invoke(result);
    console.log({ parsedResult });

    // level 2: create chain of model --> parser and do it all in one
    // here, chainResult is just the text output
    const chain = model.pipe(parser);
    const chainResult = await chain.invoke(messages);
    console.log({ chainResult });

    // level 3: instead of defining "messages" manually, create a prompt template
    // this way it's easy to reuse and pass in different parameters
    const promptTemplate = ChatPromptTemplate.fromMessages([
        [ "system", "Translate the following into {language}:" ],
        [ "user", "{text}" ],
    ]);
    // call invoke, passing an object specifying each curly bracket arg in the prompt template
    const templatedPrompt = await promptTemplate.invoke(
        { language: "italian", text: "hi" },
    );
    const templatedPromptMessages = templatedPrompt.toChatMessages();
    console.log({ templatedPromptMessages });

    // level 4: create chain of prompt template --> model --> parser and do it all in one
    const chainTwo = promptTemplate.pipe(model).pipe(parser);
    const chainTwoResult = await chainTwo.invoke(
        { language: "italian", text: "hi" },
    );
    console.log({ chainTwoResult });

    // from this we can see that a basic chain always includes three components:
    // 1) Prompt Template - templates string inputs into prompt to make model inputs
    // 2) Model - consumes model inputs to produce raw output
    // 3) Output Parser - templates raw output back into a string

}

main();
