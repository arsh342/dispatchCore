const { body } = require('express-validator');

const STRONG_PASSWORD_HINT =
  'Password must be 8-16 characters and include uppercase, lowercase, number, and special character';

/**
 * Strong password validator chain.
 * Applies minimum length and character diversity requirements.
 */
const strongPassword = (field, label = 'Password', optional = false) => {
  let chain = body(field);

  if (optional) {
    chain = chain.optional();
  }

  return chain
    .isString()
    .withMessage(`${label} must be a string`)
    .isLength({ min: 8, max: 16 })
    .withMessage(`${label} must be between 8 and 16 characters long`)
    .matches(/[a-z]/)
    .withMessage(`${label} must include at least one lowercase letter`)
    .matches(/[A-Z]/)
    .withMessage(`${label} must include at least one uppercase letter`)
    .matches(/\d/)
    .withMessage(`${label} must include at least one number`)
    .matches(/[^A-Za-z0-9]/)
    .withMessage(`${label} must include at least one special character`)
    .not()
    .matches(/\s/)
    .withMessage(`${label} must not contain spaces`);
};

module.exports = {
  strongPassword,
  STRONG_PASSWORD_HINT,
};
