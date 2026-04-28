/**
 * Firebase Authentication Middleware
 *
 * Validates Firebase ID tokens from the Authorization header.
 * Attaches decoded token + custom claims to req.auth and req.user.
 *
 * Superadmin bypass: If the token payload contains the hardcoded
 * superadmin email, the request is treated as superadmin without
 * requiring a Firebase Auth user — keeps the env-var-based
 * superadmin flow working.
 */

const { auth } = require('../config/firebase');
const { UnauthorizedError } = require('../utils/errors');
const logger = require('../config/logger');

/**
 * Extract the Bearer token from the Authorization header.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function extractBearerToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }
  return null;
}

/**
 * Main auth middleware — requires a valid Firebase ID token.
 * Populates req.auth and req.user for downstream consumers.
 */
async function authMiddleware(req, res, next) {
  try {
    const idToken = extractBearerToken(req);

    if (!idToken) {
      throw new UnauthorizedError('Access token not found');
    }

    const decoded = await auth.verifyIdToken(idToken);

    // Map Firebase claims to the shape the rest of the app expects
    req.auth = {
      uid: decoded.uid,
      email: decoded.email || null,
      phone: decoded.phone_number || null,
      role: decoded.role || null,
      companyId: decoded.companyId || null,
      driverId: decoded.driverId || null,
      isSuperadmin: decoded.role === 'superadmin',
    };

    // Backward-compatible shape for middleware/controllers still reading req.user
    req.user = {
      role: decoded.role || null,
      company_id: decoded.companyId || null,
      driver_id: decoded.driverId || null,
      email: decoded.email || null,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }

    // Firebase token verification errors
    if (error.code === 'auth/id-token-expired') {
      return next(new UnauthorizedError('Token expired'));
    }
    if (error.code === 'auth/id-token-revoked') {
      return next(new UnauthorizedError('Token revoked'));
    }
    if (error.code === 'auth/argument-error') {
      return next(new UnauthorizedError('Invalid token format'));
    }

    logger.error({ error: error.message }, 'Firebase token verification error');
    next(new UnauthorizedError('Invalid token'));
  }
}

/**
 * Optional auth middleware — continues even if token is invalid.
 * Used for public endpoints that may have optional auth.
 */
async function optionalAuth(req, res, next) {
  try {
    const idToken = extractBearerToken(req);

    if (idToken) {
      const decoded = await auth.verifyIdToken(idToken);

      req.auth = {
        uid: decoded.uid,
        email: decoded.email || null,
        phone: decoded.phone_number || null,
        role: decoded.role || null,
        companyId: decoded.companyId || null,
        driverId: decoded.driverId || null,
        isSuperadmin: decoded.role === 'superadmin',
      };
    }
  } catch {
    // Silently ignore auth errors for optional endpoints
  }

  next();
}

module.exports = {
  authMiddleware,
  optionalAuth,
};
