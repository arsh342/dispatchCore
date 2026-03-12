const router = require('express').Router();
const { login } = require('../controllers/authController');
const { login: loginValidator } = require('../validators/authValidator');
const validate = require('../middlewares/validate');

router.post('/login', loginValidator, validate, login);

module.exports = router;
