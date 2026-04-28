/**
 * Runtime Bootstrap
 *
 * Initializes runtime services and registers shutdown handlers.
 * Socket.io has been replaced by Firebase RTDB (RealtimeService).
 */

const AssignmentService = require('../services/assignmentService');
const MarketplaceService = require('../services/marketplaceService');
const LocationService = require('../services/locationService');
const RouteMatchingService = require('../services/routeMatchingService');
const HistoryService = require('../services/historyService');
const RealtimeService = require('../services/realtimeService');

/**
 * Register all runtime services on the Express app.
 * Services that previously depended on Socket.io now receive
 * a RealtimeService instance (Firebase RTDB) instead.
 */
function registerServices(app) {
  const realtime = new RealtimeService();

  const services = {
    realtimeService: realtime,
    assignmentService: new AssignmentService(realtime),
    marketplaceService: new MarketplaceService(realtime),
    locationService: new LocationService(realtime),
    routeMatchingService: new RouteMatchingService(),
    historyService: new HistoryService(),
  };

  Object.entries(services).forEach(([key, service]) => {
    app.set(key, service);
  });

  return services;
}

/**
 * Register graceful shutdown handlers.
 */
function registerShutdownHandlers({ server, sequelize, logger }) {
  let isShuttingDown = false;
  let forceExitTimer = null;

  const shutdown = async () => {
    if (isShuttingDown) {
      logger.info('Shutdown already in progress');
      return;
    }

    isShuttingDown = true;
    logger.info('Starting graceful shutdown');

    forceExitTimer = setTimeout(() => {
      logger.error('Forced termination after timeout');
      process.exit(1);
    }, 10000);

    try {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) return reject(error);
          resolve();
        });
      });
      logger.info('HTTP server closed');

      await sequelize.close();
      logger.info('Database pool drained');

      clearTimeout(forceExitTimer);
      logger.info('Termination complete');
      process.exit(0);
    } catch (error) {
      clearTimeout(forceExitTimer);
      logger.error({ err: error }, 'Graceful shutdown failed');
      process.exit(1);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = {
  registerServices,
  registerShutdownHandlers,
};
