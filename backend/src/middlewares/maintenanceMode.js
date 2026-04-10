const env = require('../config/env');

const MAINTENANCE_BYPASS_HEADER = 'x-maintenance-bypass';

module.exports = (req, res, next) => {
  if (!env.maintenance.enabled) {
    return next();
  }

  if (req.path === '/health' || req.path.startsWith('/health/')) {
    return next();
  }

  const providedBypassToken = req.headers[MAINTENANCE_BYPASS_HEADER];
  if (
    env.maintenance.bypassToken &&
    typeof providedBypassToken === 'string' &&
    providedBypassToken === env.maintenance.bypassToken
  ) {
    return next();
  }

  res.set('Retry-After', '120');
  return res.status(503).json({
    success: false,
    error: {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Service is temporarily under maintenance. Please try again shortly.',
      status: 503,
    },
  });
};

