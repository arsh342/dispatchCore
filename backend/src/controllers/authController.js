/**
 * Auth Controller (Firebase)
 *
 * Handles post-authentication session setup.
 * The actual authentication (email/password, Google, phone) happens
 * client-side via the Firebase SDK. The client then sends the
 * Firebase ID token to these endpoints to:
 *
 *   1. Link the Firebase user to a MySQL Company/Driver record
 *   2. Set custom claims (role, companyId, driverId) on the Firebase user
 *   3. Return session data for the frontend
 *
 * Superadmin bypass: If the Firebase user's email matches the
 * SUPERADMIN_EMAIL env var, they are granted superadmin access.
 */

const crypto = require('crypto');
const { Company, Driver } = require('../models');
const { success } = require('../utils/response');
const { UnauthorizedError, NotFoundError } = require('../utils/errors');
const { auth } = require('../config/firebase');
const { verifyPassword } = require('../utils/password');
const logger = require('../config/logger');

const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || 'admin@dispatchcore.com').toLowerCase();

/**
 * POST /api/auth/session
 *
 * Called after the client authenticates with Firebase.
 * Looks up the Firebase user in MySQL, sets custom claims, and returns session data.
 *
 * The request must include a valid Firebase ID token in the Authorization header
 * (handled by authMiddleware, which runs before this controller).
 */
const createSession = async (req, res, next) => {
  try {
    const { uid, email, phone } = req.auth;

    if (!uid) {
      throw new UnauthorizedError('Firebase UID is required');
    }

    // ── Superadmin check ──
    if (email && email.toLowerCase() === SUPERADMIN_EMAIL) {
      await auth.setCustomUserClaims(uid, {
        role: 'superadmin',
        companyId: null,
        driverId: null,
      });

      return success(res, {
        accountType: 'superadmin',
        targetRoute: '/superadmin',
        session: {
          name: 'Platform Admin',
          email: SUPERADMIN_EMAIL,
        },
      });
    }

    // ── Look up by email (Google / Email-Password auth) ──
    if (email) {
      // Check companies first
      const company = await Company.findOne({ where: { email } });
      if (company) {
        // Link Firebase UID if not already linked
        if (!company.firebase_uid) {
          await company.update({ firebase_uid: uid });
        }

        await auth.setCustomUserClaims(uid, {
          role: 'company',
          companyId: company.id,
          driverId: null,
        });

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

      // Check drivers
      const driver = await Driver.findOne({ where: { email } });
      if (driver) {
        if (!driver.firebase_uid) {
          await driver.update({ firebase_uid: uid });
        }

        const isEmployed = driver.type === 'EMPLOYED' && !!driver.company_id;
        const driverType = isEmployed ? 'employed_driver' : 'independent_driver';

        let companyName = null;
        if (driver.company_id) {
          const driverCompany = await Company.findByPk(driver.company_id, {
            attributes: ['id', 'name', 'location'],
          });
          companyName = driverCompany?.name ?? null;
        }

        await auth.setCustomUserClaims(uid, {
          role: driverType,
          companyId: driver.company_id || null,
          driverId: driver.id,
        });

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

      // No existing account — auto-register based on email domain
      const firebaseUser = await auth.getUser(uid);
      const displayName = firebaseUser.displayName || email.split('@')[0];
      const domain = email.split('@')[1].toLowerCase();

      // Personal/free email providers → independent driver
      const freeEmailDomains = [
        'gmail.com', 'googlemail.com',
        'yahoo.com', 'yahoo.co.in', 'yahoo.in',
        'outlook.com', 'hotmail.com', 'live.com',
        'icloud.com', 'me.com', 'mac.com',
        'aol.com', 'protonmail.com', 'proton.me',
        'zoho.com', 'yandex.com', 'mail.com',
        'rediffmail.com',
      ];

      const isPersonalEmail = freeEmailDomains.includes(domain);

      if (isPersonalEmail) {
        // Register as independent driver
        const newDriver = await Driver.create({
          name: displayName,
          email,
          phone: firebaseUser.phoneNumber || null,
          password: crypto.randomBytes(32).toString('hex'),
          type: 'INDEPENDENT',
          company_id: null,
          status: 'AVAILABLE',
          firebase_uid: uid,
        });

        await auth.setCustomUserClaims(uid, {
          role: 'independent_driver',
          companyId: null,
          driverId: newDriver.id,
        });

        logger.info({ uid, email, driverId: newDriver.id }, 'Auto-registered personal email as independent driver');

        return success(res, {
          accountType: 'independent_driver',
          targetRoute: '/driver/dashboard',
          session: {
            driverId: newDriver.id,
            companyId: null,
            companyName: null,
            name: newDriver.name,
            email: newDriver.email,
            phone: newDriver.phone,
            driverType: 'INDEPENDENT',
          },
        });
      }

      // Company/custom domain → register as company
      const companyNameFromDomain = domain.split('.')[0];
      const newCompany = await Company.create({
        name: displayName,
        email,
        password: crypto.randomBytes(32).toString('hex'),
        location: '',
        firebase_uid: uid,
      });

      await auth.setCustomUserClaims(uid, {
        role: 'company',
        companyId: newCompany.id,
        driverId: null,
      });

      logger.info({ uid, email, companyId: newCompany.id, domain }, 'Auto-registered company domain user');

      return success(res, {
        accountType: 'company',
        targetRoute: '/dashboard',
        session: {
          companyId: newCompany.id,
          companyName: newCompany.name,
          companyLocation: newCompany.location,
          name: newCompany.name,
          email: newCompany.email,
        },
      });
    }

    // ── Look up by phone (Phone auth) ──
    if (phone) {
      // Normalize: Firebase gives +91XXXXXXXXXX, DB might store differently
      const normalizedPhone = phone.replace(/\s+/g, '');

      // Check drivers first (most common phone login)
      const driver = await Driver.findOne({ where: { phone: normalizedPhone } });
      if (driver) {
        if (!driver.firebase_uid) {
          await driver.update({ firebase_uid: uid });
        }

        const isEmployed = driver.type === 'EMPLOYED' && !!driver.company_id;
        const driverType = isEmployed ? 'employed_driver' : 'independent_driver';

        let companyName = null;
        if (driver.company_id) {
          const driverCompany = await Company.findByPk(driver.company_id, {
            attributes: ['id', 'name', 'location'],
          });
          companyName = driverCompany?.name ?? null;
        }

        await auth.setCustomUserClaims(uid, {
          role: driverType,
          companyId: driver.company_id || null,
          driverId: driver.id,
        });

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

      // Check companies
      const company = await Company.findOne({ where: { phone: normalizedPhone } });
      if (company) {
        if (!company.firebase_uid) {
          await company.update({ firebase_uid: uid });
        }

        await auth.setCustomUserClaims(uid, {
          role: 'company',
          companyId: company.id,
          driverId: null,
        });

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

      throw new NotFoundError('No account found for this phone number');
    }

    throw new UnauthorizedError('Firebase user has neither email nor phone');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 *
 * Client-side logout is handled by firebase.auth().signOut().
 * This endpoint simply acknowledges and can be used for server-side cleanup.
 */
const logout = async (req, res, next) => {
  try {
    return success(res, {
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createSession, logout };
