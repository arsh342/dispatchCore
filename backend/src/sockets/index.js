/**
 * WebSocket Handler
 *
 * Manages Socket.io connections, room membership, and event routing.
 *
 * Rooms:
 *   company:{id}:dispatchers  — All dispatchers for a company
 *   company:{id}:marketplace  — Marketplace watchers (dispatchers + indie drivers)
 *   driver:{id}              — Private driver channel
 *   order:{id}:tracking      — Public customer tracking room
 */

const logger = require('../config/logger');

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    logger.info('WebSocket connected', { socketId: socket.id });

    // ── Room Join / Leave ──

    /**
     * Join a company dispatch room.
     * Dispatchers call this to receive real-time assignment updates.
     */
    socket.on('join:company', ({ companyId }) => {
      const room = `company:${companyId}:dispatchers`;
      socket.join(room);
      logger.debug('Joined room', { socketId: socket.id, room });
    });

    /**
     * Join the marketplace room.
     * Dispatchers and independent drivers watch for new listings and bids.
     */
    socket.on('join:marketplace', ({ companyId }) => {
      const room = `company:${companyId}:marketplace`;
      socket.join(room);
      logger.debug('Joined marketplace room', { socketId: socket.id, room });
    });

    /**
     * Join a driver's private channel.
     * Used for direct assignment notifications and bid results.
     */
    socket.on('join:driver', ({ driverId }) => {
      const room = `driver:${driverId}`;
      socket.join(room);
      logger.debug('Joined driver room', { socketId: socket.id, room });
    });

    /**
     * Join an order tracking room.
     * Customers watching a delivery in real-time.
     */
    socket.on('join:tracking', ({ orderId }) => {
      const room = `order:${orderId}:tracking`;
      socket.join(room);
      logger.debug('Joined tracking room', { socketId: socket.id, room });
    });

    /**
     * Join an order messaging room (channel-specific).
     * Dispatchers, drivers, and recipients join for 1-on-1 chat.
     */
    socket.on('join:messages', ({ orderId, channel }) => {
      const room = channel ? `order:${orderId}:chat:${channel}` : `order:${orderId}:messages`;
      socket.join(room);
      logger.debug('Joined messages room', { socketId: socket.id, room });
    });

    /**
     * Leave a specific room.
     */
    socket.on('leave:room', ({ room }) => {
      socket.leave(room);
      logger.debug('Left room', { socketId: socket.id, room });
    });

    // ── GPS Ping via WebSocket ──

    /**
     * Receive GPS pings directly over WebSocket (alternative to REST).
     * This is faster for high-frequency location updates.
     */
    socket.on('location:ping', async ({ driverId, lat, lng, speed, heading }) => {
      try {
        const locationService = io.locationService;
        if (locationService) {
          await locationService.recordPing(driverId, lat, lng, speed, heading);
        }
      } catch (error) {
        logger.error('WebSocket GPS ping error', { error: error.message, driverId });
      }
    });

    // ── Disconnect ──

    socket.on('disconnect', (reason) => {
      logger.info('WebSocket disconnected', { socketId: socket.id, reason });
    });
  });

  return io;
};

module.exports = { initializeSocket };
