const router = require('express').Router();
const {
  getMarketplaceListings,
} = require('../../controllers/dashboard/marketplaceDashboardController');
const { requireDriver } = require('../../middlewares/authorize');

router.get('/marketplace-listings', requireDriver, getMarketplaceListings);

module.exports = router;
