const { body } = require('express-validator');

const updateSettings = [
  body('name').optional().isString().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Email must be valid').normalizeEmail(),
  body('notification_preferences').optional().isObject(),
  body('appearance_preferences').optional().isObject(),
];

module.exports = { updateSettings };
