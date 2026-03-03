const router = require('express').Router();
const {
    getDrivers,
    getDriverById,
    verifyDriver,
    registerRoute,
    findNearbyDrivers,
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

// GET    /api/drivers/routes/nearby      — Find drivers near a path
router.get('/routes/nearby', findNearbyDriversValidator, validate, findNearbyDrivers);

// POST   /api/drivers/routes             — Pre-register a travel route
router.post('/routes', registerRouteValidator, validate, registerRoute);

// GET    /api/drivers/:id                — Driver profile
router.get('/:id', getDriverValidator, validate, getDriverById);

// PUT    /api/drivers/:id/verify         — Approve/reject independent driver
router.put('/:id/verify', verifyDriverValidator, validate, verifyDriver);

module.exports = router;
