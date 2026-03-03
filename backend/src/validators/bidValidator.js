/**
 * Bid Validators
 *
 * express-validator chains for bid-related endpoints.
 */

const { body, param } = require('express-validator');

const placeBid = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Order ID must be a positive integer'),
    body('offered_price')
        .isFloat({ min: 0.01 })
        .withMessage('Offered price must be greater than 0'),
    body('message')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Message must be 500 characters or less'),
];

const manageBid = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Bid ID must be a positive integer'),
];

module.exports = { placeBid, manageBid };
