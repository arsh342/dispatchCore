/**
 * User Routes
 *
 * Provides user lookup for the login flow.
 * CE-02 will replace this with proper JWT-based auth.
 */

const router = require('express').Router();
const { User, Driver } = require('../models');
const { success } = require('../utils/response');

/**
 * Hardcoded SuperAdmin account.
 * This account is NOT stored in the database — it lives only in code.
 * CE-02: Move to env vars + hashed password check.
 */
const SUPERADMIN = Object.freeze({
  id: 0,
  name: 'Platform Admin',
  email: 'admin@dispatchcore.com',
  phone: null,
  role: 'superadmin',
  company_id: null,
  driverProfile: null,
});

// GET /api/users?email=<email>  — Look up a user by email (login helper)
router.get('/', async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, error: { message: 'Email query parameter is required' } });
    }

    // ── SuperAdmin shortcut — no DB lookup needed ──
    if (email.toLowerCase() === SUPERADMIN.email) {
      return success(res, { ...SUPERADMIN });
    }

    const user = await User.findOne({
      where: { email },
      include: [{ model: Driver, as: 'driverProfile', required: false }],
    });

    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }

    return success(res, {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      company_id: user.company_id,
      driverProfile: user.driverProfile
        ? {
            id: user.driverProfile.id,
            type: user.driverProfile.type,
            status: user.driverProfile.status,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
