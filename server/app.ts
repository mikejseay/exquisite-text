// I'm guessing this kind of puts everything together?

// CORS stands for Cross-Origin Resource Sharing
// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
import cors from "cors";

import express from "express";                  // the app framework library
import path from "path";                        // for joining paths
import cookieParser from "cookie-parser";       // for parsing cookies
import logger from "morgan";                    // for logging
import indexRouter from "./routes/index";       // an express object that routes users to the root page /
import usersRouter from "./routes/users";       // an express object that routes users to the page /users
import poemsRouter from "./routes/poems";       // an express object that routes users to the page /poems
const app = express();                          // instantiate the app object
app.use(cors());                                // adds CORS support
app.use(logger("dev"));                         // from here on, dunno
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const isProduction = process.env.NODE_ENV === "production";
const targetDir = isProduction
    ? "../build"
    : "public";

app.use(express.static(path.join(__dirname, targetDir)));
app.use("/", indexRouter);                      // sets the router for the root page /
app.use("/users", usersRouter);                 // sets the router for the /users page
app.use("/poems", poemsRouter);                 // sets the router for the /poems page

export default app;
