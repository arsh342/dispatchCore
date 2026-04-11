/**
 * Message Routes
 *
 * /api/messages — 1-on-1 chat messaging scoped to order + channel
 *
 * Channels: dispatcher-driver, dispatcher-recipient, driver-recipient
 */

const router = require('express').Router();
const messageController = require('../controllers/messageController');
const { requireCompanyOrDriver } = require('../middlewares/authorize');
const { messageLimiter } = require('../middlewares/rateLimiter');

router.use(requireCompanyOrDriver);

// GET  /api/messages/conversations?role=dispatcher|driver|recipient[&tracking_code=...]
router.get('/conversations', messageController.getConversations);

// GET  /api/messages/:orderId/:channel?role=...&tracking_code=...
router.get('/:orderId/:channel', messageController.getMessages);

// POST /api/messages/:orderId/:channel  — send a message
router.post('/:orderId/:channel', messageLimiter, messageController.sendMessage);

// PUT  /api/messages/:orderId/:channel/read  — mark messages as read
router.put('/:orderId/:channel/read', messageLimiter, messageController.markAsRead);

module.exports = router;
