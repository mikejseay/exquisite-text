import pino from "pino";

const LOG_LEVEL = process.env.REACT_APP_LOG_LEVEL;

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
