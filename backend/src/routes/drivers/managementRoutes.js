const router = require('express').Router();
const tenantResolver = require('../../middlewares/tenantResolver');
const validate = require('../../middlewares/validate');
const {
  requireCompanyOrSuperadmin,
  requireCompanyOrDriver,
  requireSuperadmin,
} = require('../../middlewares/authorize');
const {
  getDriver: getDriverValidator,
  createDriver: createDriverValidator,
  verifyDriver: verifyDriverValidator,
} = require('../../validators/driverValidator');
const {
  getDrivers,
  getDriverById,
  verifyDriver,
  createDriver,
  updateDriverStatus,
} = require('../../controllers/drivers/managementController');

router.get('/', requireCompanyOrSuperadmin, tenantResolver, getDrivers);
router.post(
  '/',
  requireCompanyOrSuperadmin,
  tenantResolver,
  createDriverValidator,
  validate,
  createDriver,
);
router.get('/:id', requireCompanyOrDriver, getDriverValidator, validate, getDriverById);
router.put('/:id/verify', requireSuperadmin, verifyDriverValidator, validate, verifyDriver);
router.patch('/:id/status', requireCompanyOrDriver, updateDriverStatus);

module.exports = router;
