const router = require('express').Router();
const {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
} = require('../controllers/companyController');

// POST   /api/companies       — Register a new company (SuperAdmin)
router.post('/', createCompany);

// GET    /api/companies       — List all companies (SuperAdmin)
router.get('/', getAllCompanies);

// GET    /api/companies/:id   — Get company details (Dispatcher)
router.get('/:id', getCompanyById);

// PUT    /api/companies/:id   — Update company settings (Dispatcher)
router.put('/:id', updateCompany);

module.exports = router;
