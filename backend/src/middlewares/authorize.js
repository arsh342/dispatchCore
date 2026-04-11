const { ForbiddenError } = require('../utils/errors');

function parseRouteInt(value) {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function isSuperadmin(req) {
  return Boolean(req.identity?.isSuperadmin);
}

function isDriver(req) {
  return Boolean(req.identity?.driverId);
}

function isDispatcher(req) {
  return Boolean(req.identity?.companyId) && !isSuperadmin(req);
}

/**
 * Require superadmin actor.
 */
function requireSuperadmin(req, res, next) {
  if (isSuperadmin(req)) {
    return next();
  }

  return next(new ForbiddenError('Superadmin access required'));
}

/**
 * Require dispatcher actor (company-scoped user).
 */
function requireDispatcher(req, res, next) {
  if (isDispatcher(req)) {
    return next();
  }

  return next(new ForbiddenError('Dispatcher access required'));
}

/**
 * Require driver actor.
 */
function requireDriver(req, res, next) {
  if (isDriver(req)) {
    return next();
  }

  return next(new ForbiddenError('Driver access required'));
}

/**
 * Require dispatcher or superadmin actor.
 */
function requireCompanyOrSuperadmin(req, res, next) {
  if (isDispatcher(req) || isSuperadmin(req)) {
    return next();
  }

  return next(new ForbiddenError('Company or superadmin access required'));
}

/**
 * Require dispatcher or driver actor.
 */
function requireCompanyOrDriver(req, res, next) {
  if (isDispatcher(req) || isDriver(req)) {
    return next();
  }

  return next(new ForbiddenError('Dispatcher or driver access required'));
}

/**
 * Require route param company id to match actor company id unless superadmin.
 */
function requireCompanyParamAccess(paramName = 'id') {
  return (req, res, next) => {
    if (isSuperadmin(req)) {
      return next();
    }

    const actorCompanyId = req.identity?.companyId ?? null;
    const requestedCompanyId = parseRouteInt(req.params[paramName]);

    if (!actorCompanyId || !requestedCompanyId || actorCompanyId !== requestedCompanyId) {
      return next(new ForbiddenError('You do not have access to this company'));
    }

    return next();
  };
}

module.exports = {
  requireSuperadmin,
  requireDispatcher,
  requireDriver,
  requireCompanyOrSuperadmin,
  requireCompanyOrDriver,
  requireCompanyParamAccess,
};
