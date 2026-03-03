/**
 * Rate Limiter Middleware
 *
 * Protects API endpoints from abuse:
 *   - apiLimiter: General API endpoints (100 requests / 15 minutes)
 *   - locationLimiter: GPS ping endpoint (20 requests / minute ≈ 1 every 3 seconds)
 */

const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests, please try again later',
            status: 429,
        },
    },
});

const locationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMITED',
            message: 'Too many location updates, limit is 20 per minute',
            status: 429,
        },
    },
});

module.exports = { apiLimiter, locationLimiter };
