const router = require('express').Router();
const {
  getDrivers,
  getDriverById,
  verifyDriver,
  registerRoute,
  findNearbyDrivers,
  createDriver,
  updateDriverStatus,
  getMyRoutes,
  deactivateRoute,
  getActiveRoutesForDispatchers,
} = require('../controllers/driverController');
const {
  getDriver: getDriverValidator,
  verifyDriver: verifyDriverValidator,
  registerRoute: registerRouteValidator,
  findNearbyDrivers: findNearbyDriversValidator,
} = require('../validators/driverValidator');
const validate = require('../middlewares/validate');
const tenantResolver = require('../middlewares/tenantResolver');

// GET    /api/drivers                    — List drivers (company-scoped)
router.get('/', tenantResolver, getDrivers);

// POST   /api/drivers                    — Create an employed driver
router.post('/', tenantResolver, createDriver);

// GET    /api/drivers/routes/nearby      — Find drivers near a path
router.get('/routes/nearby', findNearbyDriversValidator, validate, findNearbyDrivers);

// GET    /api/drivers/routes/active      — All active routes (for dispatchers)
router.get('/routes/active', getActiveRoutesForDispatchers);

// GET    /api/drivers/routes/mine        — Driver's own routes
router.get('/routes/mine', getMyRoutes);

// POST   /api/drivers/routes             — Pre-register a travel route
router.post('/routes', registerRouteValidator, validate, registerRoute);

// DELETE /api/drivers/routes/:routeId    — Deactivate a route
router.delete('/routes/:routeId', deactivateRoute);

// GET    /api/drivers/:id                — Driver profile
router.get('/:id', getDriverValidator, validate, getDriverById);

// PUT    /api/drivers/:id/verify         — Approve/reject independent driver
router.put('/:id/verify', verifyDriverValidator, validate, verifyDriver);

// PATCH  /api/drivers/:id/status         — Update driver status
router.patch('/:id/status', updateDriverStatus);

module.exports = router;
