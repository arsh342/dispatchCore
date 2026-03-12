const router = require('express').Router();
const {
  getDrivers,
  getDriverById,
  verifyDriver,
  registerRoute,
  findNearbyDrivers,
  createDriver,
  createIndependentDriver,
  updateDriverStatus,
  getMyRoutes,
  deactivateRoute,
  getActiveRoutesForDispatchers,
  updateDriver,
  updateDriverPassword,
  updateDriverVehicle,
} = require('../controllers/driverController');
const {
  getDriver: getDriverValidator,
  createDriver: createDriverValidator,
  createIndependentDriver: createIndependentDriverValidator,
  verifyDriver: verifyDriverValidator,
  updateDriver: updateDriverValidator,
  updateDriverPassword: updateDriverPasswordValidator,
  updateDriverVehicle: updateDriverVehicleValidator,
  registerRoute: registerRouteValidator,
  findNearbyDrivers: findNearbyDriversValidator,
} = require('../validators/driverValidator');
const validate = require('../middlewares/validate');
const tenantResolver = require('../middlewares/tenantResolver');

// POST   /api/drivers/signup             — Create an independent driver account
router.post('/signup', createIndependentDriverValidator, validate, createIndependentDriver);

// GET    /api/drivers                    — List drivers (company-scoped)
router.get('/', tenantResolver, getDrivers);

// POST   /api/drivers                    — Create an employed driver
router.post('/', tenantResolver, createDriverValidator, validate, createDriver);

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

// PUT    /api/drivers/:id                — Update driver profile/settings
router.put('/:id', updateDriverValidator, validate, updateDriver);

// PUT    /api/drivers/:id/password       — Update driver password
router.put('/:id/password', updateDriverPasswordValidator, validate, updateDriverPassword);

// PUT    /api/drivers/:id/vehicle        — Create/update a driver's vehicle
router.put('/:id/vehicle', updateDriverVehicleValidator, validate, updateDriverVehicle);

// PUT    /api/drivers/:id/verify         — Approve/reject independent driver
router.put('/:id/verify', verifyDriverValidator, validate, verifyDriver);

// PATCH  /api/drivers/:id/status         — Update driver status
router.patch('/:id/status', updateDriverStatus);

module.exports = router;
