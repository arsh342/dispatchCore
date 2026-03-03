/**
 * Express Application Setup
 *
 * Assembles all middleware, routes, and the global error handler.
 * Exported as a standalone module so server.js can attach Socket.io.
 */

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const corsMiddleware = require('./config/cors');
const { apiLimiter } = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');
const routes = require('./routes');
const logger = require('./config/logger');

const app = express();

// ── Security ──
app.use(helmet());

// ── HTTP Request Logging ──
app.use(
    morgan('combined', {
        stream: { write: (message) => logger.info(message.trim()) },
    }),
);

// ── Body Parsers ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── CORS ──
app.use(corsMiddleware);

// ── Rate Limiting (global) ──
app.use('/api', apiLimiter);

// ── API Routes ──
app.use('/api', routes);

// ── 404 Handler ──
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.originalUrl} not found`,
            status: 404,
        },
    });
});

// ── Global Error Handler (must be last) ──
app.use(errorHandler);

module.exports = app;
