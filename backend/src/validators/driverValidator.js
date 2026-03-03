/**
 * Driver Validators
 *
 * express-validator chains for driver-related endpoints.
 * Covers profile management, verification, and route registration.
 */

const { body, param, query } = require('express-validator');
const { DRIVER_TYPE } = require('../utils/constants');

const getDriver = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Driver ID must be a positive integer'),
];

const verifyDriver = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Driver ID must be a positive integer'),
    body('verification_status')
        .isIn(['VERIFIED', 'REJECTED'])
        .withMessage('Verification status must be VERIFIED or REJECTED'),
];

const registerRoute = [
    body('start_lat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Start latitude must be between -90 and 90'),
    body('start_lng')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Start longitude must be between -180 and 180'),
    body('end_lat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('End latitude must be between -90 and 90'),
    body('end_lng')
        .isFloat({ min: -180, max: 180 })
        .withMessage('End longitude must be between -180 and 180'),
    body('departure_time')
        .isISO8601()
        .withMessage('Departure time must be a valid ISO 8601 date')
        .custom((value) => {
            if (new Date(value) <= new Date()) {
                throw new Error('Departure time must be in the future');
            }
            return true;
        }),
];

const findNearbyDrivers = [
    query('pickup_lat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Pickup latitude must be between -90 and 90'),
    query('pickup_lng')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Pickup longitude must be between -180 and 180'),
    query('delivery_lat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Delivery latitude must be between -90 and 90'),
    query('delivery_lng')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Delivery longitude must be between -180 and 180'),
    query('radius_km')
        .optional()
        .isFloat({ min: 0.1, max: 100 })
        .withMessage('Radius must be between 0.1 and 100 km'),
];

module.exports = { getDriver, verifyDriver, registerRoute, findNearbyDrivers };
