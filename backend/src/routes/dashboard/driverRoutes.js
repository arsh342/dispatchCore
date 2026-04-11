const router = require('express').Router();
const {
  getDriverStats,
  getDriverBids,
} = require('../../controllers/dashboard/driverDashboardController');
const { requireDriver } = require('../../middlewares/authorize');

router.get('/driver-stats', requireDriver, getDriverStats);
router.get('/driver-bids', requireDriver, getDriverBids);

module.exports = router;
