/**
 * Location Validators
 *
 * express-validator chains for GPS tracking endpoints.
 * Validates coordinates, speed, and heading values.
 */

const { body, param } = require('express-validator');

const pingLocation = [
    body('lat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),
    body('lng')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180'),
    body('speed')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Speed must be a non-negative number'),
    body('heading')
        .optional()
        .isFloat({ min: 0, max: 360 })
        .withMessage('Heading must be between 0 and 360 degrees'),
];

const trackOrder = [
    param('trackingCode')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Tracking code is required'),
];

module.exports = { pingLocation, trackOrder };
