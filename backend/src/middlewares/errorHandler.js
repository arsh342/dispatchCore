/**
 * Global Error Handler Middleware
 *
 * Catches all unhandled errors thrown by controllers/services.
 * Returns a standardized error response envelope.
 * Logs full stack in development, sanitized message in production.
 */

const logger = require('../config/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
    const status = err.status || 500;
    const code = err.code || 'INTERNAL_ERROR';
    const message = status === 500 ? 'Something went wrong' : err.message;

    // Log the error
    if (status >= 500) {
        logger.error(`${code}: ${err.message}`, {
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
        });
    } else {
        logger.warn(`${code}: ${err.message}`, {
            url: req.originalUrl,
            method: req.method,
        });
    }

    const response = {
        success: false,
        error: { code, message, status },
    };

    // Include validation details if present
    if (err.details) {
        response.error.details = err.details;
    }

    // Include stack trace in development only
    if (process.env.NODE_ENV === 'development' && status >= 500) {
        response.error.stack = err.stack;
    }

    return res.status(status).json(response);
};

module.exports = errorHandler;
