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
    // CE-02: Replace with JWT-extracted company_id
    // For now, use header-based tenant identification
    const companyId = req.headers['x-company-id'] || (req.user && req.user.company_id);

    // SuperAdmins operate across all tenants
    if (req.user && req.user.role === ROLES.SUPERADMIN) {
        req.tenantId = companyId ? parseInt(companyId, 10) : null;
        return next();
    }

    if (!companyId) {
        throw new ForbiddenError('Company context is required. Provide x-company-id header.');
    }

    const parsedId = parseInt(companyId, 10);

    if (isNaN(parsedId) || parsedId <= 0) {
        throw new ForbiddenError('Invalid company ID');
    }

    req.tenantId = parsedId;
    next();
};

module.exports = tenantResolver;
