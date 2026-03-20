import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import pinoHttp from "pino-http";
import { logger } from "utilities/loggerUtils";

const app = express();
app.use(cors());
app.use(pinoHttp({ logger }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const isProduction = process.env.NODE_ENV === "production";
const targetDir = isProduction ? "../build" : "public";

app.use(express.static(path.join(__dirname, targetDir)));

// All remaining requests return the React app, so it can handle routing.
app.get("{*path}", (_request, response) => {
    response.sendFile(path.resolve(__dirname, targetDir, "index.html"));
});

export default app;
