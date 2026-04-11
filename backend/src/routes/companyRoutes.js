const router = require('express').Router();
const {
  createCompany,
  loginCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  updateCompanyPassword,
} = require('../controllers/companyController');
const {
  createCompany: createCompanyValidator,
  loginCompany: loginCompanyValidator,
  updateCompany: updateCompanyValidator,
  updateCompanyPassword: updateCompanyPasswordValidator,
} = require('../validators/companyValidator');
const validate = require('../middlewares/validate');
const {
  requireSuperadmin,
  requireCompanyOrSuperadmin,
  requireCompanyParamAccess,
} = require('../middlewares/authorize');
const { authLimiter } = require('../middlewares/rateLimiter');

// POST   /api/companies       — Register a new company (SuperAdmin)
router.post('/', authLimiter, createCompanyValidator, validate, createCompany);

// POST   /api/companies/login — Company account login
router.post('/login', authLimiter, loginCompanyValidator, validate, loginCompany);

// GET    /api/companies       — List all companies (SuperAdmin)
router.get('/', requireSuperadmin, getAllCompanies);

// GET    /api/companies/:id   — Get company details (Dispatcher)
router.get('/:id', requireCompanyOrSuperadmin, requireCompanyParamAccess('id'), getCompanyById);

// PUT    /api/companies/:id   — Update company settings (Dispatcher)
router.put(
  '/:id',
  requireCompanyOrSuperadmin,
  requireCompanyParamAccess('id'),
  updateCompanyValidator,
  validate,
  updateCompany,
);

// PUT    /api/companies/:id/password — Update company password
router.put(
  '/:id/password',
  requireCompanyOrSuperadmin,
  requireCompanyParamAccess('id'),
  updateCompanyPasswordValidator,
  validate,
  updateCompanyPassword,
);

module.exports = router;
