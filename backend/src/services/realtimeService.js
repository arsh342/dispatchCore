/**
 * Realtime Service (Firebase RTDB)
 *
 * Central replacement for all Socket.io emits.
 * Pushes events to structured RTDB paths that frontend
 * clients subscribe to via onChildAdded / onValue listeners.
 *
 * RTDB Schema:
 *   /locations/{driverId}                          — Live GPS (overwritten each ping)
 *   /events/companies/{companyId}/{eventType}      — Company dispatcher events
 *   /events/drivers/{driverId}/{eventType}         — Driver-specific events
 *   /events/marketplace/{companyId}/{eventType}    — Marketplace events
 *   /events/orders/{orderId}                       — Order tracking events
 *   /chats/{orderId}/{channel}/messages            — Chat message delivery
 */

const { db } = require('../config/firebase');
const admin = require('firebase-admin');
const logger = require('../config/logger');

const SERVER_TIMESTAMP = admin.database.ServerValue.TIMESTAMP;

class RealtimeService {
  /**
   * Update a driver's live location in RTDB.
   * Uses set() (overwrite) since we only care about the latest position.
   *
   * @param {number} driverId
   * @param {object} location - { lat, lng, speed, heading }
   * @param {string} [status] - Driver status (AVAILABLE, BUSY, OFFLINE)
   */
  async updateDriverLocation(driverId, location, status = null) {
    try {
      const ref = db.ref(`locations/${driverId}`);
      await ref.set({
        lat: location.lat,
        lng: location.lng,
        speed: location.speed ?? null,
        heading: location.heading ?? null,
        ...(status ? { status } : {}),
        updatedAt: SERVER_TIMESTAMP,
      });
    } catch (error) {
      logger.error({ error: error.message, driverId }, 'Failed to update RTDB location');
    }
  }

  /**
   * Push an event to a company's dispatcher feed.
   *
   * @param {number} companyId
   * @param {string} eventType - e.g. 'assignment:created'
   * @param {object} data - Event payload
   */
  async emitToCompany(companyId, eventType, data) {
    try {
      const sanitizedType = eventType.replace(':', '_');
      const ref = db.ref(`events/companies/${companyId}/${sanitizedType}`);
      await ref.push({
        ...data,
        type: eventType,
        timestamp: SERVER_TIMESTAMP,
      });
    } catch (error) {
      logger.error({ error: error.message, companyId, eventType }, 'Failed to push company event');
    }
  }

  /**
   * Push an event to a driver's personal feed.
   *
   * @param {number} driverId
   * @param {string} eventType - e.g. 'assignment:new', 'bid:accepted'
   * @param {object} data - Event payload
   */
  async emitToDriver(driverId, eventType, data) {
    try {
      const sanitizedType = eventType.replace(':', '_');
      const ref = db.ref(`events/drivers/${driverId}/${sanitizedType}`);
      await ref.push({
        ...data,
        type: eventType,
        timestamp: SERVER_TIMESTAMP,
      });
    } catch (error) {
      logger.error({ error: error.message, driverId, eventType }, 'Failed to push driver event');
    }
  }

  /**
   * Push an event to the marketplace feed for a company.
   *
   * @param {number} companyId
   * @param {string} eventType - e.g. 'order:listed', 'bid:new'
   * @param {object} data - Event payload
   */
  async emitToMarketplace(companyId, eventType, data) {
    try {
      const sanitizedType = eventType.replace(':', '_');
      const ref = db.ref(`events/marketplace/${companyId}/${sanitizedType}`);
      await ref.push({
        ...data,
        type: eventType,
        timestamp: SERVER_TIMESTAMP,
      });
    } catch (error) {
      logger.error(
        { error: error.message, companyId, eventType },
        'Failed to push marketplace event',
      );
    }
  }

  /**
   * Push an event to an order's tracking feed.
   *
   * @param {number} orderId
   * @param {string} eventType - e.g. 'order:statusChanged'
   * @param {object} data - Event payload
   */
  async emitToOrderTracking(orderId, eventType, data) {
    try {
      const ref = db.ref(`events/orders/${orderId}`);
      await ref.push({
        ...data,
        type: eventType,
        timestamp: SERVER_TIMESTAMP,
      });
    } catch (error) {
      logger.error({ error: error.message, orderId, eventType }, 'Failed to push order event');
    }
  }

  /**
   * Push a chat message to the RTDB for real-time delivery.
   * (MySQL remains the source of truth for message persistence.)
   *
   * @param {number} orderId
   * @param {string} channel - e.g. 'dispatcher-driver'
   * @param {object} message - Formatted message payload
   */
  async emitChatMessage(orderId, channel, message) {
    try {
      const ref = db.ref(`chats/${orderId}/${channel}/messages`);
      await ref.push({
        ...message,
        timestamp: SERVER_TIMESTAMP,
      });
    } catch (error) {
      logger.error({ error: error.message, orderId, channel }, 'Failed to push chat message');
    }
  }
}

module.exports = RealtimeService;
