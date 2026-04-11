const router = require('express').Router();
const { createIndependentDriver } = require('../../controllers/drivers/managementController');
const {
  createIndependentDriver: createIndependentDriverValidator,
} = require('../../validators/driverValidator');
const validate = require('../../middlewares/validate');
const { authLimiter } = require('../../middlewares/rateLimiter');

router.post(
  '/signup',
  authLimiter,
  createIndependentDriverValidator,
  validate,
  createIndependentDriver,
);

module.exports = router;
