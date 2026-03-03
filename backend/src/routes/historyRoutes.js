const router = require('express').Router();
const { getHistory, getDeliveryDetail } = require('../controllers/historyController');
const tenantResolver = require('../middlewares/tenantResolver');

// All history routes need tenant context
router.use(tenantResolver);

// GET    /api/history                    — Delivery history (role-scoped)
router.get('/', getHistory);

// GET    /api/history/:assignmentId      — Single delivery details
router.get('/:assignmentId', getDeliveryDetail);

module.exports = router;
