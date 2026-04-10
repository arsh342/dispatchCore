/**
 * Express Application Setup
 *
 * Assembles all middleware, routes, and the global error handler.
 * Exported as a standalone module so server.js can attach Socket.io.
 */

const express = require('express');
const helmet = require('helmet');
const corsMiddleware = require('./config/cors');
const { apiLimiter } = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');
const requestIdentity = require('./middlewares/requestIdentity');
const maintenanceMode = require('./middlewares/maintenanceMode');
const routes = require('./routes');
const logger = require('./config/logger');

const app = express();

// ── Security ──
app.use(helmet());

// ── HTTP Request Logging ──
app.use((req, res, next) => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
        logger.info(
            {
                method: req.method,
                path: req.originalUrl,
                statusCode: res.statusCode,
                durationMs: Number(durationMs.toFixed(2)),
                ip: req.ip,
            },
            'HTTP request',
        );
    });

    next();
});

// ── Body Parsers ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── CORS ──
app.use(corsMiddleware);

// ── CE-01 Identity Context ──
app.use(requestIdentity);

// ── Maintenance Mode (for controlled cutovers) ──
app.use('/api', maintenanceMode);

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
