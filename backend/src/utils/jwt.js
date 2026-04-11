/**
 * JWT Utilities
 *
 * Handles JWT token generation, verification, and refresh logic.
 * Tokens include identity info (userId, role, tenantId) for authorization checks.
 */

const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('./errors');
const env = require('../config/env');

const ACCESS_TOKEN_SECRET = env.jwt.accessSecret;
const REFRESH_TOKEN_SECRET = env.jwt.refreshSecret;

const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload (userId, role, etc.)
 * @returns {string} Signed JWT token
 */
function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Generate JWT refresh token
 * @param {Object} payload - Token payload
 * @returns {string} Signed refresh token
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload
 * @throws {UnauthorizedError} If token is invalid or expired
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Access token expired');
    }
    throw new UnauthorizedError('Invalid access token');
  }
}

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 * @throws {UnauthorizedError} If token is invalid or expired
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Refresh token expired');
    }
    throw new UnauthorizedError('Invalid refresh token');
  }
}

/**
 * Generate token payload from user/driver/superadmin data
 * @param {Object} opts - User info
 * @returns {Object} Token payload
 */
function generateTokenPayload(opts) {
  const { userId, userId_type, role, companyId, driverId, email } = opts;

  return {
    userId,
    userId_type, // 'superadmin', 'company', 'driver'
    role,
    companyId: companyId || null,
    driverId: driverId || null,
    email,
  };
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPayload,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
};
