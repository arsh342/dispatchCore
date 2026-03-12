/**
 * SuperAdmin Routes
 *
 * Platform-level endpoints — no tenant scoping.
 * CE-02: Add authentication/authorization middleware (superadmin role check).
 */

const router = require('express').Router();
const {
  getPlatformStats,
  getCompanies,
  getAllDrivers,
  getAllOrders,
  getSettings,
  updateSettings,
} = require('../controllers/superadminController');
const { updateSettings: updateSettingsValidator } = require('../validators/superadminValidator');
const validate = require('../middlewares/validate');

// GET /api/superadmin/stats      — Platform-wide KPIs
router.get('/stats', getPlatformStats);

// GET /api/superadmin/companies  — All companies with counts
router.get('/companies', getCompanies);

// GET /api/superadmin/drivers    — All drivers across platform
router.get('/drivers', getAllDrivers);

// GET /api/superadmin/orders     — All orders across platform
router.get('/orders', getAllOrders);

// GET /api/superadmin/settings   — Persistent superadmin profile/preferences
router.get('/settings', getSettings);

// PUT /api/superadmin/settings   — Update persistent superadmin profile/preferences
router.put('/settings', updateSettingsValidator, validate, updateSettings);

module.exports = router;
