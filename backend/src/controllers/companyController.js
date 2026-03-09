/**
 * Company Controller
 *
 * Handles company CRUD operations.
 * SuperAdmin: full access to all companies.
 * Dispatcher: access to own company only.
 */

const { Company } = require('../models');
const { success } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

const createCompany = async (req, res, next) => {
  try {
    const { name, address, plan_type } = req.body;

    const company = await Company.create({ name, address, plan_type });

    return success(res, company, null, 201);
  } catch (error) {
    next(error);
  }
};

const getAllCompanies = async (req, res, next) => {
  try {
    const companies = await Company.findAll({
      order: [['created_at', 'DESC']],
    });

    return success(res, companies);
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

    return success(res, company);
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

    const { name, address, plan_type } = req.body;
    await company.update({ name, address, plan_type });

    return success(res, company);
  } catch (error) {
    next(error);
  }
};

module.exports = { createCompany, getAllCompanies, getCompanyById, updateCompany };
