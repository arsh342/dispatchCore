/**
 * Server Entry Point
 *
 * Creates the HTTP server and mounts Express.
 * Initializes runtime services and graceful shutdown handling.
 *
 * Socket.io has been replaced by Firebase RTDB — no WebSocket
 * server is needed. Real-time events flow through Firebase.
 */

const http = require('http');

const app = require('./src/app');
const env = require('./src/config/env');
const logger = require('./src/config/logger');
const { sequelize } = require('./src/models');
const {
  registerServices,
  registerShutdownHandlers,
} = require('./src/bootstrap/runtime');

// Ensure Firebase is initialized on startup
require('./src/config/firebase');

/**
 * Authenticate infrastructure dependencies, compose runtime services,
 * and begin accepting HTTP traffic.
 */
const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database authenticated');

    const server = http.createServer(app);

    registerServices(app);
    logger.info('Runtime services initialized');

    server.on('error', (error) => {
      logger.error({ err: error }, 'HTTP server failed');
      process.exit(1);
    });

    server.listen(env.port, () => {
      logger.info({ port: env.port, nodeEnv: env.nodeEnv }, 'Server started');
    });

    registerShutdownHandlers({ server, sequelize, logger });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();
