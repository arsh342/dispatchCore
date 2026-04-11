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
    max: 1000, // 1000 requests per 15 min (generous for dev, tighten in production)
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

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'AUTH_RATE_LIMITED',
            message: 'Too many authentication attempts, please try again later',
            status: 429,
        },
    },
});

const writeLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'WRITE_RATE_LIMITED',
            message: 'Too many write requests, please try again later',
            status: 429,
        },
    },
});

const messageLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'MESSAGE_RATE_LIMITED',
            message: 'Too many messages, please slow down',
            status: 429,
        },
    },
});

const publicTrackingLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'TRACKING_RATE_LIMITED',
            message: 'Too many tracking requests, please try again later',
            status: 429,
        },
    },
});

const locationReadLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'LOCATION_RATE_LIMITED',
            message: 'Too many location reads, please try again later',
            status: 429,
        },
    },
});

module.exports = {
    apiLimiter,
    locationLimiter,
    authLimiter,
    writeLimiter,
    messageLimiter,
    publicTrackingLimiter,
    locationReadLimiter,
};
