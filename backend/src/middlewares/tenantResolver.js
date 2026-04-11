/**
 * Tenant Resolver Middleware
 *
 * Extracts and validates the company_id (tenant) from the request.
 * Ensures every tenant-scoped query is properly isolated.
 *
 * The company_id is resolved from:
 *   1. req.headers['x-company-id'] (for API consumers)
 *   2. req.user.company_id (populated by future auth middleware in CE-02)
 *
 * Once resolved, it is attached to req.tenantId for use in controllers/services.
 * SuperAdmins bypass tenant scoping (they have platform-wide access).
 */

const { ForbiddenError } = require('../utils/errors');
const { ROLES } = require('../utils/constants');

const tenantResolver = (req, res, next) => {
  const companyId = req.identity?.companyId ?? null;
  const driverId = req.identity?.driverId ?? null;

  // SuperAdmins operate across all tenants
  if (req.identity?.isSuperadmin || (req.user && req.user.role === ROLES.SUPERADMIN)) {
    req.tenantId = companyId;
    return next();
  }

  // Independent drivers may not have a company — allow them through
  // with tenantId = null so role-scoped controllers can handle them.
  if (driverId && !companyId) {
    req.tenantId = null;
    return next();
  }

  if (!companyId) {
    throw new ForbiddenError('Company context is required for this operation.');
  }

  if (!Number.isInteger(companyId) || companyId <= 0) {
    throw new ForbiddenError('Invalid company ID');
  }

  req.tenantId = companyId;
  next();
};

module.exports = tenantResolver;
