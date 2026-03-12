/**
 * Server Entry Point
 *
 * Creates the HTTP server, attaches Socket.io, and mounts Express.
 * initializes all services, and wires everything together.
 *
 * Also handles graceful shutdown — closes sockets, drains DB pool,
 * and stops accepting new connections before exiting.
 */

const http = require('http');
const { Server: SocketIO } = require('socket.io');
const express = require('express');

const app = require('./src/app');
const env = require('./src/config/env');
const logger = require('./src/config/logger');
const { sequelize } = require('./src/models');

// WebSocket
const { initializeSocket } = require('./src/sockets');

// Services
const AssignmentService = require('./src/services/assignmentService');
const MarketplaceService = require('./src/services/marketplaceService');
const LocationService = require('./src/services/locationService');
const RouteMatchingService = require('./src/services/routeMatchingService');
const HistoryService = require('./src/services/historyService');

// ── Bootstrap ──

const wsCorsOrigins = env.wsCorsOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const startServer = async () => {
  try {
    // 1. Test database connection
    await sequelize.authenticate();
    logger.info('Database connected');

    // 2. Sync models → create tables if they don't exist
    await sequelize.sync({ alter: env.nodeEnv === 'development' });
    logger.info('Database tables synced');

    // 2. Create HTTP server
    const server = http.createServer(app);

    // 3. Initialize Socket.io
    const io = new SocketIO(server, {
      cors: {
        origin: wsCorsOrigins,
        methods: ['GET', 'POST'],
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    initializeSocket(io);
    logger.info('WebSocket initialized');

    // Expose io on Express app for controllers (e.g. messageController)
    app.set('io', io);

    // 4. Initialize services (inject Socket.io)
    const assignmentService = new AssignmentService(io);
    const marketplaceService = new MarketplaceService(io);
    const locationService = new LocationService(io);
    const routeMatchingService = new RouteMatchingService();
    const historyService = new HistoryService();

    // Attach to Express app for controller access
    app.set('assignmentService', assignmentService);
    app.set('marketplaceService', marketplaceService);
    app.set('locationService', locationService);
    app.set('routeMatchingService', routeMatchingService);
    app.set('historyService', historyService);

    // Expose locationService on io for WebSocket GPS pings
    io.locationService = locationService;

    // 5. Start listening (Express / REST / Sockets)
    server.listen(env.port, () => {
      logger.info(`dispatchCore backend running on port ${env.port}`);
      logger.info(`   Environment: ${env.nodeEnv}`);
      logger.info(`   Health:      http://localhost:${env.port}/api/health`);
    });

    // ── Graceful Shutdown ──

    const shutdown = async (signal) => {
      logger.info(`\n${signal} received — shutting down gracefully...`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');

        // Close all WebSocket connections
        io.close(() => {
          logger.info('WebSocket connections closed');
        });

        // Drain database pool
        await sequelize.close();
        logger.info('Database pool drained');

        logger.info('Graceful shutdown complete');
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
