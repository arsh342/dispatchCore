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

// POST   /api/companies       — Register a new company (SuperAdmin)
router.post('/', createCompanyValidator, validate, createCompany);

// POST   /api/companies/login — Company account login
router.post('/login', loginCompanyValidator, validate, loginCompany);

// GET    /api/companies       — List all companies (SuperAdmin)
router.get('/', getAllCompanies);

// GET    /api/companies/:id   — Get company details (Dispatcher)
router.get('/:id', getCompanyById);

// PUT    /api/companies/:id   — Update company settings (Dispatcher)
router.put('/:id', updateCompanyValidator, validate, updateCompany);

// PUT    /api/companies/:id/password — Update company password
router.put('/:id/password', updateCompanyPasswordValidator, validate, updateCompanyPassword);

module.exports = router;
