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

const createDriver = [
    body('name').isString().trim().notEmpty().withMessage('Driver name is required'),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password')
        .isString()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('phone').optional().isString().trim().isLength({ max: 20 }),
    body('license_number').optional().isString().trim().isLength({ max: 50 }),
    body('vehicle_type')
        .optional()
        .isIn(['BIKE', 'VAN', 'TRUCK'])
        .withMessage('Vehicle type must be BIKE, VAN, or TRUCK'),
    body('plate_number').optional().isString().trim().isLength({ max: 50 }),
    body('capacity_kg').optional().isFloat({ min: 1 }),
];

const createIndependentDriver = [
    body('name').isString().trim().notEmpty().withMessage('Driver name is required'),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password')
        .isString()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('phone').optional().isString().trim().isLength({ max: 20 }),
    body('license_number').optional().isString().trim().isLength({ max: 50 }),
];

const verifyDriver = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Driver ID must be a positive integer'),
    body('verification_status')
        .isIn(['VERIFIED', 'REJECTED'])
        .withMessage('Verification status must be VERIFIED or REJECTED'),
];

const updateDriver = [
    param('id').isInt({ min: 1 }).withMessage('Driver ID must be a positive integer'),
    body('name').optional().isString().trim().notEmpty().withMessage('Driver name cannot be empty'),
    body('email').optional().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('phone').optional().isString().trim().isLength({ max: 20 }),
    body('license_number').optional().isString().trim().isLength({ max: 50 }),
    body('notification_preferences').optional().isObject(),
    body('appearance_preferences').optional().isObject(),
];

const updateDriverPassword = [
    param('id').isInt({ min: 1 }).withMessage('Driver ID must be a positive integer'),
    body('current_password').isString().notEmpty().withMessage('Current password is required'),
    body('new_password')
        .isString()
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long'),
];

const updateDriverVehicle = [
    param('id').isInt({ min: 1 }).withMessage('Driver ID must be a positive integer'),
    body('type')
        .isIn(['BIKE', 'VAN', 'TRUCK'])
        .withMessage('Vehicle type must be BIKE, VAN, or TRUCK'),
    body('plate_number').isString().trim().isLength({ min: 1, max: 50 }),
    body('capacity_kg').isFloat({ min: 1 }).withMessage('Capacity must be at least 1 kg'),
    body('status')
        .optional()
        .isIn(['ACTIVE', 'MAINTENANCE', 'RETIRED'])
        .withMessage('Status must be ACTIVE, MAINTENANCE, or RETIRED'),
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

module.exports = {
    getDriver,
    createDriver,
    createIndependentDriver,
    verifyDriver,
    updateDriver,
    updateDriverPassword,
    updateDriverVehicle,
    registerRoute,
    findNearbyDrivers,
};
