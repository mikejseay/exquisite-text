// I'm guessing this kind of puts everything together?

// CORS stands for Cross-Origin Resource Sharing
// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cors = require("cors");
// eslint-disable-next-line @typescript-eslint/no-var-requires
export const express = require("express");      // the app framework library
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");                   // for joining paths
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cookieParser = require("cookie-parser");  // for parsing cookies
// eslint-disable-next-line @typescript-eslint/no-var-requires
const logger = require("morgan");               // for logging

// eslint-disable-next-line @typescript-eslint/no-var-requires
const indexRouter = require("./routes/index");  // an express object that routes users to the root page /
// eslint-disable-next-line @typescript-eslint/no-var-requires
const usersRouter = require("./routes/users");  // an express object that routes users to the page /users

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

export default app;
