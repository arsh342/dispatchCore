const router = require('express').Router();
const tenantResolver = require('../../middlewares/tenantResolver');
const { getStats, getUser } = require('../../controllers/dashboard/dispatcherDashboardController');
const { requireCompanyOrSuperadmin } = require('../../middlewares/authorize');

router.get('/stats', requireCompanyOrSuperadmin, tenantResolver, getStats);
router.get('/user', requireCompanyOrSuperadmin, tenantResolver, getUser);

module.exports = router;
