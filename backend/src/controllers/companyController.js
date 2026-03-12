/**
 * Company Controller
 *
 * Handles company CRUD operations.
 * SuperAdmin: full access to all companies.
 * Dispatcher: access to own company only.
 */

const { Company, Driver } = require('../models');
const { success } = require('../utils/response');
const { NotFoundError, ConflictError, UnauthorizedError } = require('../utils/errors');
const { hashPassword, verifyPassword } = require('../utils/password');

const defaultNotificationPreferences = {
  bid_notifications: true,
  delivery_updates: true,
  driver_messages: true,
  daily_summary_email: false,
  driver_applications: true,
  payment_alerts: false,
};

const defaultAppearancePreferences = {
  theme: 'dark',
};

const serializeCompany = (company) => ({
  id: company.id,
  name: company.name,
  email: company.email,
  location: company.location,
  address: company.address,
  contact_name: company.contact_name,
  phone: company.phone,
  plan_type: company.plan_type,
  notification_preferences:
    company.notification_preferences ?? defaultNotificationPreferences,
  appearance_preferences:
    company.appearance_preferences ?? defaultAppearancePreferences,
  created_at: company.created_at,
  updated_at: company.updated_at,
});

const createCompany = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      location,
      address,
      contact_name,
      phone,
      plan_type,
      notification_preferences,
      appearance_preferences,
    } = req.body;

    const existingCompany = await Company.findOne({ where: { email } });
    if (existingCompany) {
      throw new ConflictError('A company with this email already exists');
    }
    const existingDriver = await Driver.findOne({ where: { email } });
    if (existingDriver) {
      throw new ConflictError('This email is already used by a driver account');
    }

    const normalizedLocation = location.trim();
    const company = await Company.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password_hash: hashPassword(password),
      location: normalizedLocation,
      address: address ? address.trim() : normalizedLocation,
      contact_name: contact_name ? contact_name.trim() : null,
      phone: phone ? phone.trim() : null,
      plan_type,
      notification_preferences: notification_preferences ?? defaultNotificationPreferences,
      appearance_preferences: appearance_preferences ?? defaultAppearancePreferences,
    });

    return success(res, serializeCompany(company), null, 201);
  } catch (error) {
    next(error);
  }
};

const loginCompany = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const company = await Company.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (!company || !verifyPassword(password, company.password_hash)) {
      throw new UnauthorizedError('Incorrect email or password');
    }

    return success(res, serializeCompany(company));
  } catch (error) {
    next(error);
  }
};

const getAllCompanies = async (req, res, next) => {
  try {
    const companies = await Company.findAll({
      order: [['created_at', 'DESC']],
    });

    return success(res, companies.map(serializeCompany));
  } catch (error) {
    next(error);
  }
};

const getCompanyById = async (req, res, next) => {
  try {
    const company = await Company.findByPk(req.params.id);

    if (!company) {
      throw new NotFoundError('Company');
    }

    return success(res, serializeCompany(company));
  } catch (error) {
    next(error);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findByPk(req.params.id);

    if (!company) {
      throw new NotFoundError('Company');
    }

    const {
      name,
      email,
      password,
      location,
      address,
      contact_name,
      phone,
      plan_type,
      notification_preferences,
      appearance_preferences,
    } = req.body;

    if (email && email.trim().toLowerCase() !== company.email) {
      const existingCompany = await Company.findOne({
        where: { email: email.trim().toLowerCase() },
      });
      if (existingCompany && existingCompany.id !== company.id) {
        throw new ConflictError('A company with this email already exists');
      }
      const existingDriver = await Driver.findOne({
        where: { email: email.trim().toLowerCase() },
      });
      if (existingDriver) {
        throw new ConflictError('This email is already used by a driver account');
      }
    }

    await company.update({
      name: name ?? company.name,
      email: email ? email.trim().toLowerCase() : company.email,
      password_hash: password ? hashPassword(password) : company.password_hash,
      location: location ?? company.location,
      address: address ?? company.address ?? location ?? company.location,
      contact_name: contact_name ?? company.contact_name,
      phone: phone ?? company.phone,
      plan_type: plan_type ?? company.plan_type,
      notification_preferences:
        notification_preferences ?? company.notification_preferences ?? defaultNotificationPreferences,
      appearance_preferences:
        appearance_preferences ?? company.appearance_preferences ?? defaultAppearancePreferences,
    });

    return success(res, serializeCompany(company));
  } catch (error) {
    next(error);
  }
};

const updateCompanyPassword = async (req, res, next) => {
  try {
    const company = await Company.findByPk(req.params.id);

    if (!company) {
      throw new NotFoundError('Company');
    }

    const { current_password, new_password } = req.body;

    if (!verifyPassword(current_password, company.password_hash)) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    await company.update({
      password_hash: hashPassword(new_password),
    });

    return success(res, { updated: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCompany,
  loginCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  updateCompanyPassword,
};
