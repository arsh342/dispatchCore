/**
 * JWT Authentication Middleware
 *
 * Validates JWT access token from cookies and attaches user info to req.
 * If token is expired, returns 401 to trigger frontend refresh flow.
 * If token is invalid, returns 401 to force re-authentication.
 */

const { UnauthorizedError } = require('../utils/errors');
const { verifyAccessToken } = require('../utils/jwt');
const logger = require('../config/logger');

/**
 * Middleware to validate JWT from cookies
 * Attaches decoded token to req.auth
 */
function authMiddleware(req, res, next) {
  try {
    const cookieToken = req.cookies?.accessToken;
    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : null;
    const accessToken = cookieToken || bearerToken;

    if (!accessToken) {
      throw new UnauthorizedError('Access token not found');
    }

    const decoded = verifyAccessToken(accessToken);
    req.auth = decoded;

    // Backward-compatible shape for middleware/controllers still reading req.user
    req.user = {
      role: decoded.role,
      company_id: decoded.companyId ?? null,
      driver_id: decoded.driverId ?? null,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }
    logger.error({ error: error.message }, 'JWT validation error');
    next(new UnauthorizedError('Invalid token'));
  }
}

/**
 * Optional auth middleware — continues even if token is invalid
 * Used for public endpoints that may have optional auth
 */
function optionalAuth(req, res, next) {
  try {
    const cookieToken = req.cookies?.accessToken;
    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : null;
    const accessToken = cookieToken || bearerToken;

    if (accessToken) {
      const decoded = verifyAccessToken(accessToken);
      req.auth = decoded;
    }
  } catch (error) {
    // Silently ignore auth errors for optional endpoints
  }

  next();
}

module.exports = {
  authMiddleware,
  optionalAuth,
};
