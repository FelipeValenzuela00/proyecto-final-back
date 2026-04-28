const { createLogger, format, transports } = require('winston');

const { combine, timestamp, colorize, printf, errors } = format;

const consoleFormat = printf(({ level, message, timestamp: ts, stack }) => {
    return `${ts} [${level}]: ${stack || message}`;
});

const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
    ),
    transports: [
        new transports.Console({
            format: combine(colorize(), consoleFormat),
        }),
        new transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: combine(format.json()),
        }),
        new transports.File({
            filename: 'logs/combined.log',
            format: combine(format.json()),
        }),
    ],
});

module.exports = logger;
