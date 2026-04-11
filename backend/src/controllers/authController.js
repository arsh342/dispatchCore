const crypto = require('crypto');
const { Company, Driver } = require('../models');
const { success } = require('../utils/response');
const { UnauthorizedError } = require('../utils/errors');
const { verifyPassword } = require('../utils/password');
const { signAccessToken, signRefreshToken, generateTokenPayload } = require('../utils/jwt');
const env = require('../config/env');

const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || 'admin@dispatchcore.com').toLowerCase();
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || null;

function hashForComparison(value) {
  return crypto.createHash('sha256').update(String(value)).digest();
}

/**
 * Set JWT tokens as httpOnly Secure cookies
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
function setTokenCookies(req, res, accessToken, refreshToken) {
  const isProduction = env.nodeEnv === 'production';
  const sameSite = isProduction ? 'None' : 'Lax';
  const secure = isProduction;

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

const login = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (email === SUPERADMIN_EMAIL) {
      if (!SUPERADMIN_PASSWORD) {
        throw new UnauthorizedError('Superadmin login is not configured');
      }

      const inputHash = hashForComparison(password);
      const expectedHash = hashForComparison(SUPERADMIN_PASSWORD);
      const isValid = crypto.timingSafeEqual(inputHash, expectedHash);
      if (!isValid) {
        throw new UnauthorizedError('Incorrect email or password');
      }

      const tokenPayload = generateTokenPayload({
        userId: 'superadmin',
        userId_type: 'superadmin',
        role: 'superadmin',
        email: SUPERADMIN_EMAIL,
      });

      const accessToken = signAccessToken(tokenPayload);
      const refreshToken = signRefreshToken(tokenPayload);
      setTokenCookies(req, res, accessToken, refreshToken);

      return success(res, {
        accountType: 'superadmin',
        targetRoute: '/superadmin',
        session: {
          name: 'Platform Admin',
          email: SUPERADMIN_EMAIL,
        },
      });
    }

    const company = await Company.findOne({ where: { email } });
    if (company) {
      if (!verifyPassword(password, company.password_hash)) {
        throw new UnauthorizedError('Incorrect email or password');
      }

      const tokenPayload = generateTokenPayload({
        userId: company.id,
        userId_type: 'company',
        role: 'company',
        companyId: company.id,
        email: company.email,
      });

      const accessToken = signAccessToken(tokenPayload);
      const refreshToken = signRefreshToken(tokenPayload);
      setTokenCookies(req, res, accessToken, refreshToken);

      return success(res, {
        accountType: 'company',
        targetRoute: '/dashboard',
        session: {
          companyId: company.id,
          companyName: company.name,
          companyLocation: company.location,
          name: company.name,
          email: company.email,
        },
      });
    }

    const driver = await Driver.findOne({ where: { email } });
    if (driver) {
      if (!verifyPassword(password, driver.password_hash)) {
        throw new UnauthorizedError('Incorrect email or password');
      }

      let companyName = null;
      if (driver.company_id) {
        const driverCompany = await Company.findByPk(driver.company_id, {
          attributes: ['id', 'name', 'location'],
        });
        companyName = driverCompany?.name ?? null;
      }

      const isEmployed = driver.type === 'EMPLOYED' && !!driver.company_id;
      const driverType = isEmployed ? 'employed_driver' : 'independent_driver';

      const tokenPayload = generateTokenPayload({
        userId: driver.id,
        userId_type: 'driver',
        role: driverType,
        companyId: driver.company_id,
        driverId: driver.id,
        email: driver.email,
      });

      const accessToken = signAccessToken(tokenPayload);
      const refreshToken = signRefreshToken(tokenPayload);
      setTokenCookies(req, res, accessToken, refreshToken);

      return success(res, {
        accountType: driverType,
        targetRoute: isEmployed ? '/employed-driver/dashboard' : '/driver/dashboard',
        session: {
          driverId: driver.id,
          companyId: driver.company_id,
          companyName,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          driverType: driver.type,
        },
      });
    }

    throw new UnauthorizedError('Email is not registered');
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token using refresh token
 * Frontend calls this when access token expires (401 response)
 */
const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token not found');
    }

    const { verifyRefreshToken } = require('../utils/jwt');
    const decoded = verifyRefreshToken(refreshToken);

    const tokenPayload = generateTokenPayload({
      userId: decoded.userId,
      userId_type: decoded.userId_type,
      role: decoded.role,
      companyId: decoded.companyId,
      driverId: decoded.driverId,
      email: decoded.email,
    });

    if (tokenPayload.userId == null || !tokenPayload.role || !tokenPayload.email) {
      throw new UnauthorizedError('Refresh token payload is invalid');
    }

    // Generate new access token with same payload
    const newAccessToken = signAccessToken(tokenPayload);
    
    // Optionally rotate refresh token too (for extra security)
    const newRefreshToken = signRefreshToken(tokenPayload);
    setTokenCookies(req, res, newAccessToken, newRefreshToken);

    return success(res, {
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout — clear JWT cookies
 */
const logout = async (req, res, next) => {
  try {
    const isProduction = env.nodeEnv === 'production';
    const sameSite = isProduction ? 'None' : 'Lax';
    const secure = isProduction;

    res.clearCookie('accessToken', {
      path: '/',
      httpOnly: true,
      secure,
      sameSite,
    });
    res.clearCookie('refreshToken', {
      path: '/',
      httpOnly: true,
      secure,
      sameSite,
    });

    return success(res, {
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, refresh, logout };
