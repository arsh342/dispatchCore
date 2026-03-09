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
} = require('../controllers/superadminController');

// GET /api/superadmin/stats      — Platform-wide KPIs
router.get('/stats', getPlatformStats);

// GET /api/superadmin/companies  — All companies with counts
router.get('/companies', getCompanies);

// GET /api/superadmin/drivers    — All drivers across platform
router.get('/drivers', getAllDrivers);

// GET /api/superadmin/orders     — All orders across platform
router.get('/orders', getAllOrders);

module.exports = router;
