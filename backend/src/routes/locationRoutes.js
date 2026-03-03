const router = require('express').Router();
const { pingLocation, trackOrder } = require('../controllers/locationController');
const { pingLocation: pingValidator, trackOrder: trackValidator } = require('../validators/locationValidator');
const validate = require('../middlewares/validate');
const { locationLimiter } = require('../middlewares/rateLimiter');

// POST   /api/location/ping             — Submit GPS coordinates (rate limited)
router.post('/ping', locationLimiter, pingValidator, validate, pingLocation);

// GET    /api/track/:trackingCode        — Public tracking data (no auth)
router.get('/track/:trackingCode', trackValidator, validate, trackOrder);

module.exports = router;
