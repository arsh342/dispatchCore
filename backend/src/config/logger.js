/**
 * Structured Logger
 *
 * Winston-based logger with JSON format for production
 * and colorized console output for development.
 *
 * Log Levels (when to use):
 *   error  — Failed transactions, DB connection loss, unhandled exceptions
 *   warn   — Lock timeouts, bid on already-assigned order, rate limit hit
 *   info   — Assignment created, bid accepted, driver went online
 *   debug  — GPS ping received, WebSocket room join, query execution time
 */

const winston = require('winston');
const env = require('./env');

const logger = winston.createLogger({
    level: env.nodeEnv === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
    ),
    defaultMeta: { service: 'dispatchCore' },
    transports: [
        new winston.transports.Console({
            format:
                env.nodeEnv === 'production'
                    ? winston.format.json()
                    : winston.format.combine(
                        winston.format.colorize(),
                        winston.format.printf(({ level, message, timestamp, ...meta }) => {
                            const metaStr = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
                            return `${timestamp} ${level}: ${message}${metaStr}`;
                        }),
                    ),
        }),
    ],
});

module.exports = logger;
