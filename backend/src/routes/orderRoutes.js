const router = require('express').Router();
const {
    createOrder,
    getOrders,
    getOrderById,
    listOrderOnMarketplace,
    unlistOrder,
    assignOrder,
    getOrderBids,
    updateOrderStatus,
} = require('../controllers/orderController');
const { createOrder: createOrderValidator, listOrder: listOrderValidator, assignOrder: assignOrderValidator, getOrder: getOrderValidator } = require('../validators/orderValidator');
const validate = require('../middlewares/validate');
const tenantResolver = require('../middlewares/tenantResolver');

// All order routes require tenant context
router.use(tenantResolver);

// POST   /api/orders                — Create a new order
router.post('/', createOrderValidator, validate, createOrder);

// GET    /api/orders                — List orders (company-scoped)
router.get('/', getOrders);

// GET    /api/orders/:id            — Get order details
router.get('/:id', getOrderValidator, validate, getOrderById);

// PUT    /api/orders/:id/list       — List order on marketplace
router.put('/:id/list', listOrderValidator, validate, listOrderOnMarketplace);

// PUT    /api/orders/:id/unlist     — Remove from marketplace
router.put('/:id/unlist', getOrderValidator, validate, unlistOrder);

// POST   /api/orders/:id/assign     — Direct assign to employed driver
router.post('/:id/assign', assignOrderValidator, validate, assignOrder);

// GET    /api/orders/:id/bids       — Get all bids for an order
router.get('/:id/bids', getOrderValidator, validate, getOrderBids);

// PATCH  /api/orders/:id/status     — Update order status (driver action)
router.patch('/:id/status', updateOrderStatus);

module.exports = router;
