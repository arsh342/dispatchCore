const router = require('express').Router();
const {
  getStats,
  getUser,
  getMarketplaceListings,
  getDriverStats,
  getDriverBids,
} = require('../controllers/dashboardController');
const tenantResolver = require('../middlewares/tenantResolver');

// Dashboard stats (tenant-scoped)
router.get('/stats', tenantResolver, getStats);

// Current user profile (tenant-scoped)
router.get('/user', tenantResolver, getUser);

// Cross-tenant marketplace listings (for independent drivers)
router.get('/marketplace-listings', getMarketplaceListings);

// Driver aggregated stats
router.get('/driver-stats', getDriverStats);

// Driver's bids with order details (no tenant scoping — used by independent drivers)
router.get('/driver-bids', getDriverBids);

module.exports = router;
