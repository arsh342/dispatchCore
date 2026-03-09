/**
 * Order Validators
 *
 * express-validator chains for order-related endpoints.
 * Validates coordinates, pricing, priority, and weight.
 */

const { body, param } = require('express-validator');
const { PRIORITY } = require('../utils/constants');

const createOrder = [
  body('pickup_lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Pickup latitude must be between -90 and 90'),
  body('pickup_lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Pickup longitude must be between -180 and 180'),
  body('delivery_lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Delivery latitude must be between -90 and 90'),
  body('delivery_lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Delivery longitude must be between -180 and 180'),
  body('pickup_address').optional().isString().trim().isLength({ max: 255 }),
  body('delivery_address').optional().isString().trim().isLength({ max: 255 }),
  body('priority')
    .optional()
    .isIn(Object.values(PRIORITY))
    .withMessage(`Priority must be one of: ${Object.values(PRIORITY).join(', ')}`),
  body('weight_kg').optional().isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
  body('notes').optional().isString().trim(),
  body('recipient_name')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Recipient name must be 100 characters or less'),
  body('recipient_phone')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Recipient phone must be 20 characters or less'),
  body('recipient_email')
    .optional()
    .isString()
    .trim()
    .isEmail()
    .withMessage('Recipient email must be a valid email address'),
];

const listOrder = [
  param('id').isInt({ min: 1 }).withMessage('Order ID must be a positive integer'),
  body('listed_price').isFloat({ min: 0.01 }).withMessage('Listed price must be greater than 0'),
];

const assignOrder = [
  param('id').isInt({ min: 1 }).withMessage('Order ID must be a positive integer'),
  body('driver_id').isInt({ min: 1 }).withMessage('Driver ID must be a positive integer'),
  body('vehicle_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Vehicle ID must be a positive integer'),
];

const getOrder = [param('id').isInt({ min: 1 }).withMessage('Order ID must be a positive integer')];

module.exports = { createOrder, listOrder, assignOrder, getOrder };
