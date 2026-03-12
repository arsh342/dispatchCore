const { Company, Driver } = require('../models');
const { success } = require('../utils/response');
const { UnauthorizedError } = require('../utils/errors');
const { verifyPassword } = require('../utils/password');

const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || 'admin@dispatchcore.com').toLowerCase();
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || null;

const login = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (email === SUPERADMIN_EMAIL) {
      const isValid = SUPERADMIN_PASSWORD ? password === SUPERADMIN_PASSWORD : password.length > 0;
      if (!isValid) {
        throw new UnauthorizedError('Incorrect email or password');
      }

      return success(res, {
        accountType: 'superadmin',
        targetRoute: '/superadmin',
        session: {
          name: 'Platform Admin',
          email: SUPERADMIN_EMAIL,
        },
      });
    }

    const company = await Company.findOne({ where: { email } });
    if (company && verifyPassword(password, company.password_hash)) {
      return success(res, {
        accountType: 'company',
        targetRoute: '/dashboard',
        session: {
          companyId: company.id,
          companyName: company.name,
          companyLocation: company.location,
          name: company.name,
          email: company.email,
        },
      });
    }

    const driver = await Driver.findOne({ where: { email } });
    if (driver && verifyPassword(password, driver.password_hash)) {
      let companyName = null;
      if (driver.company_id) {
        const driverCompany = await Company.findByPk(driver.company_id, {
          attributes: ['id', 'name', 'location'],
        });
        companyName = driverCompany?.name ?? null;
      }

      const isEmployed = driver.type === 'EMPLOYED' && !!driver.company_id;

      return success(res, {
        accountType: isEmployed ? 'employed_driver' : 'independent_driver',
        targetRoute: isEmployed ? '/employed-driver/dashboard' : '/driver/dashboard',
        session: {
          driverId: driver.id,
          companyId: driver.company_id,
          companyName,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          driverType: driver.type,
        },
      });
    }

    throw new UnauthorizedError('Incorrect email or password');
  } catch (error) {
    next(error);
  }
};

module.exports = { login };
