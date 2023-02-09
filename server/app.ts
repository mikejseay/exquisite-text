// I'm guessing this kind of puts everything together?

// CORS stands for Cross-Origin Resource Sharing
// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
import cors from "cors";

import express from "express"; // the app framework library
import path from "path"; // for joining paths
import cookieParser from "cookie-parser"; // for parsing cookies
import logger from "morgan"; // for logging
import poemsRouter from "./routes/poems"; // an express object that routes poems to the page /poems

const app = express(); // instantiate the app object
app.use(cors()); // adds CORS support
app.use(logger("dev")); // from here on, dunno
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const isProduction = process.env.NODE_ENV === "production";
const targetDir = isProduction
    ? "../build"
    : "public";

// Priority serve any static files.
app.use(express.static(path.join(__dirname, targetDir)));

// Answer API requests.
app.use("/poems", poemsRouter);

// All remaining requests return the React app, so it can handle routing.
app.get("*", function (request, response) {
    response.sendFile(path.resolve(__dirname, targetDir, "index.html"));
});

export default app;
