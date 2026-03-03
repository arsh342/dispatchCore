const router = require('express').Router();
const { placeBid, acceptBid, rejectBid } = require('../controllers/bidController');
const { placeBid: placeBidValidator, manageBid: manageBidValidator } = require('../validators/bidValidator');
const validate = require('../middlewares/validate');

// POST   /api/orders/:id/bid    — Place a bid (nested under orders in the route aggregator)
router.post('/orders/:id/bid', placeBidValidator, validate, placeBid);

// PUT    /api/bids/:id/accept   — Accept a bid
router.put('/:id/accept', manageBidValidator, validate, acceptBid);

// PUT    /api/bids/:id/reject   — Reject a bid
router.put('/:id/reject', manageBidValidator, validate, rejectBid);

module.exports = router;
