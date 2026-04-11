const router = require('express').Router();
const validate = require('../../middlewares/validate');
const {
  updateDriver: updateDriverValidator,
  updateDriverPassword: updateDriverPasswordValidator,
  updateDriverVehicle: updateDriverVehicleValidator,
} = require('../../validators/driverValidator');
const {
  updateDriver,
  updateDriverPassword,
  updateDriverVehicle,
} = require('../../controllers/drivers/profileController');
const { requireCompanyOrDriver } = require('../../middlewares/authorize');
const { writeLimiter } = require('../../middlewares/rateLimiter');

router.put('/:id', requireCompanyOrDriver, writeLimiter, updateDriverValidator, validate, updateDriver);
router.put(
  '/:id/password',
  requireCompanyOrDriver,
  writeLimiter,
  updateDriverPasswordValidator,
  validate,
  updateDriverPassword,
);
router.put(
  '/:id/vehicle',
  requireCompanyOrDriver,
  writeLimiter,
  updateDriverVehicleValidator,
  validate,
  updateDriverVehicle,
);

module.exports = router;
