const { body, param } = require('express-validator');

const createCompany = [
  body('name').isString().trim().notEmpty().withMessage('Company name is required'),
  body('email').isEmail().withMessage('A valid company email is required').normalizeEmail(),
  body('password')
    .isString()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('location').isString().trim().notEmpty().withMessage('Location is required'),
  body('address').optional().isString().trim().isLength({ max: 255 }),
  body('contact_name').optional().isString().trim().isLength({ max: 100 }),
  body('phone').optional().isString().trim().isLength({ max: 20 }),
  body('plan_type')
    .optional()
    .isIn(['STARTER', 'GROWTH', 'ENTERPRISE'])
    .withMessage('Plan type must be STARTER, GROWTH, or ENTERPRISE'),
];

const loginCompany = [
  body('email').isEmail().withMessage('A valid company email is required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

const updateCompany = [
  param('id').isInt({ min: 1 }).withMessage('Company ID must be a positive integer'),
  body('name').optional().isString().trim().notEmpty().withMessage('Company name cannot be empty'),
  body('email').optional().isEmail().withMessage('Email must be valid').normalizeEmail(),
  body('password')
    .optional()
    .isString()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('location').optional().isString().trim().notEmpty().withMessage('Location cannot be empty'),
  body('address').optional().isString().trim().isLength({ max: 255 }),
  body('contact_name').optional().isString().trim().isLength({ max: 100 }),
  body('phone').optional().isString().trim().isLength({ max: 20 }),
  body('plan_type')
    .optional()
    .isIn(['STARTER', 'GROWTH', 'ENTERPRISE'])
    .withMessage('Plan type must be STARTER, GROWTH, or ENTERPRISE'),
  body('notification_preferences').optional().isObject(),
  body('appearance_preferences').optional().isObject(),
];

const updateCompanyPassword = [
  param('id').isInt({ min: 1 }).withMessage('Company ID must be a positive integer'),
  body('current_password').isString().notEmpty().withMessage('Current password is required'),
  body('new_password')
    .isString()
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
];

module.exports = { createCompany, loginCompany, updateCompany, updateCompanyPassword };
