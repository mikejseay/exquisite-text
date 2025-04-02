import pino from "pino";
import * as dotenv from "dotenv";

dotenv.config({ path: __dirname + "/../.env" });

const LOG_LEVEL = process.env.LOG_LEVEL;

export const logger = pino({
    level: LOG_LEVEL ?? "error",
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
        },
    },
});
