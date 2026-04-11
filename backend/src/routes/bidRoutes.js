const router = require('express').Router();
const { placeBid, acceptBid, rejectBid } = require('../controllers/bidController');
const { placeBid: placeBidValidator, manageBid: manageBidValidator } = require('../validators/bidValidator');
const validate = require('../middlewares/validate');
const tenantResolver = require('../middlewares/tenantResolver');
const { requireDriver, requireCompanyOrSuperadmin } = require('../middlewares/authorize');
const { writeLimiter } = require('../middlewares/rateLimiter');

// POST   /api/orders/:id/bid    — Place a bid (nested under orders in the route aggregator)
router.post('/orders/:id/bid', requireDriver, writeLimiter, placeBidValidator, validate, placeBid);

// PUT    /api/bids/:id/accept   — Accept a bid
router.put(
	'/:id/accept',
	requireCompanyOrSuperadmin,
	tenantResolver,
	writeLimiter,
	manageBidValidator,
	validate,
	acceptBid,
);

// PUT    /api/bids/:id/reject   — Reject a bid
router.put(
	'/:id/reject',
	requireCompanyOrSuperadmin,
	tenantResolver,
	writeLimiter,
	manageBidValidator,
	validate,
	rejectBid,
);

module.exports = router;
