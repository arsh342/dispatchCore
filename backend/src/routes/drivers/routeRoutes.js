const router = require('express').Router();
const validate = require('../../middlewares/validate');
const tenantResolver = require('../../middlewares/tenantResolver');
const { requireCompanyOrSuperadmin, requireDriver } = require('../../middlewares/authorize');
const { writeLimiter } = require('../../middlewares/rateLimiter');
const {
  registerRoute: registerRouteValidator,
  findNearbyDrivers: findNearbyDriversValidator,
} = require('../../validators/driverValidator');
const {
  registerRoute,
  findNearbyDrivers,
  getMyRoutes,
  deactivateRoute,
  getActiveRoutesForDispatchers,
} = require('../../controllers/drivers/routeController');

router.get(
  '/routes/nearby',
  requireCompanyOrSuperadmin,
  tenantResolver,
  findNearbyDriversValidator,
  validate,
  findNearbyDrivers,
);
router.get('/routes/active', requireCompanyOrSuperadmin, tenantResolver, getActiveRoutesForDispatchers);
router.get('/routes/mine', requireDriver, getMyRoutes);
router.post('/routes', requireDriver, writeLimiter, registerRouteValidator, validate, registerRoute);
router.delete('/routes/:routeId', requireDriver, writeLimiter, deactivateRoute);

module.exports = router;
