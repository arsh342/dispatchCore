const { ROLES } = require('../utils/constants');

function parsePositiveInt(value) {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Normalize CE-01 header-based identity into a single request shape.
 * This keeps controller logic consistent now and makes CE-02 auth migration
 * simpler because the rest of the app can depend on req.identity.
 */
const requestIdentity = (req, res, next) => {
  const tokenCompanyId = req.auth ? parsePositiveInt(req.auth.companyId) : null;
  const tokenDriverId = req.auth ? parsePositiveInt(req.auth.driverId) : null;
  const tokenRole = req.auth?.role ?? null;
  const headerCompanyId = parsePositiveInt(req.headers['x-company-id']);
  const headerDriverId = parsePositiveInt(req.headers['x-driver-id']);
  const userCompanyId = req.user ? parsePositiveInt(req.user.company_id) : null;
  const userDriverId = req.user ? parsePositiveInt(req.user.driver_id) : null;
  const hasTrustedAuth = Boolean(req.auth);
  const isSuperadmin =
    req.auth?.role === ROLES.SUPERADMIN ||
    req.user?.role === ROLES.SUPERADMIN;

  const companyId = hasTrustedAuth
    ? tokenCompanyId ?? userCompanyId
    : headerCompanyId ?? userCompanyId;
  const driverId = hasTrustedAuth
    ? tokenDriverId ?? userDriverId
    : headerDriverId ?? userDriverId;

  let actorType = 'anonymous';
  if (isSuperadmin) {
    actorType = ROLES.SUPERADMIN;
  } else if (tokenRole === 'employed_driver' || tokenRole === 'independent_driver') {
    actorType = 'driver';
  } else if (tokenRole === 'company') {
    actorType = ROLES.DISPATCHER;
  } else if (driverId) {
    actorType = 'driver';
  } else if (companyId) {
    actorType = ROLES.DISPATCHER;
  }

  // Keep CE-01 legacy controllers stable without trusting user-supplied headers.
  if (hasTrustedAuth) {
    if (companyId) {
      req.headers['x-company-id'] = String(companyId);
    }
    if (driverId) {
      req.headers['x-driver-id'] = String(driverId);
    }
  }

  req.identity = {
    companyId,
    driverId,
    actorType,
    isSuperadmin,
  };

  next();
};

module.exports = requestIdentity;
