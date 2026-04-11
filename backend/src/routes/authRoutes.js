const router = require('express').Router();
const { login, refresh, logout } = require('../controllers/authController');
const { login: loginValidator } = require('../validators/authValidator');
const validate = require('../middlewares/validate');
const { authLimiter } = require('../middlewares/rateLimiter');

router.post('/login', authLimiter, loginValidator, validate, login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', authLimiter, logout);

module.exports = router;
