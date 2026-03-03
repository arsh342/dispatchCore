/**
 * Validation Middleware
 *
 * Runs express-validator validation chains and returns
 * a standardized error response if any fields fail validation.
 * Place this AFTER validator arrays in route definitions.
 */

const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid input',
                details: errors.array().map((err) => ({
                    field: err.path,
                    message: err.msg,
                    value: err.value,
                })),
                status: 400,
            },
        });
    }

    next();
};

module.exports = validate;
