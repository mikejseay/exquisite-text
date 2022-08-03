// I'm guessing this kind of puts everything together?

// CORS stands for Cross-Origin Resource Sharing
// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
const cors = require("cors");
export const express = require("express");      // the app framework library
const path = require("path");                   // for joining paths
const cookieParser = require("cookie-parser");  // for parsing cookies
const logger = require("morgan");               // for logging

const indexRouter = require("./routes/index");  // an express object that routes users to the root page /
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
