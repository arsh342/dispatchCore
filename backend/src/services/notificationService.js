/**
 * Notification Service (Firebase Cloud Messaging)
 *
 * Sends push notifications to drivers via FCM.
 * Looks up device tokens from Firebase RTDB /deviceTokens/{driverId}.
 */

const { db, messaging } = require('../config/firebase');
const logger = require('../config/logger');

class NotificationService {
  /**
   * Send a push notification to a specific driver.
   *
   * @param {number} driverId
   * @param {string} title - Notification title
   * @param {string} body - Notification body text
   * @param {object} [data] - Optional data payload for the client to handle
   */
  async sendToDriver(driverId, title, body, data = {}) {
    try {
      const tokens = await this._getDeviceTokens(driverId);

      if (tokens.length === 0) {
        logger.debug({ driverId }, 'No FCM tokens registered for driver');
        return;
      }

      const message = {
        notification: { title, body },
        data: {
          ...Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)]),
          ),
          driverId: String(driverId),
        },
      };

      // Send to all registered device tokens
      const results = await Promise.allSettled(
        tokens.map((token) =>
          messaging.send({ ...message, token }),
        ),
      );

      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected');

      logger.info(
        { driverId, sent: succeeded, failed: failed.length },
        'FCM notifications sent',
      );

      // Clean up invalid tokens
      for (let i = 0; i < results.length; i++) {
        if (results[i].status === 'rejected') {
          const error = results[i].reason;
          if (
            error?.code === 'messaging/registration-token-not-registered' ||
            error?.code === 'messaging/invalid-registration-token'
          ) {
            await this._removeDeviceToken(driverId, tokens[i]);
          }
        }
      }
    } catch (error) {
      logger.error({ error: error.message, driverId }, 'Failed to send FCM notification');
    }
  }

  /**
   * Send a push notification on assignment.
   *
   * @param {number} driverId
   * @param {object} order - Order details
   */
  async notifyAssignment(driverId, order) {
    await this.sendToDriver(
      driverId,
      'New Delivery Assignment',
      `Pickup: ${order.pickupAddress || 'N/A'}\nDrop: ${order.deliveryAddress || 'N/A'}`,
      {
        type: 'assignment:new',
        orderId: String(order.id),
        url: '/employed-driver/dashboard',
      },
    );
  }

  /**
   * Send a push notification when a bid is accepted.
   *
   * @param {number} driverId
   * @param {number} bidId
   * @param {number} orderId
   */
  async notifyBidAccepted(driverId, bidId, orderId) {
    await this.sendToDriver(
      driverId,
      'Bid Accepted! 🎉',
      'Your bid has been accepted. Check your dashboard for details.',
      {
        type: 'bid:accepted',
        bidId: String(bidId),
        orderId: String(orderId),
        url: '/driver/dashboard',
      },
    );
  }

  /**
   * Send a push notification when a bid is rejected.
   *
   * @param {number} driverId
   * @param {number} bidId
   * @param {number} orderId
   */
  async notifyBidRejected(driverId, bidId, orderId) {
    await this.sendToDriver(
      driverId,
      'Bid Update',
      'Your bid was not selected for this delivery.',
      {
        type: 'bid:rejected',
        bidId: String(bidId),
        orderId: String(orderId),
      },
    );
  }

  /**
   * Get all registered FCM tokens for a driver.
   * @private
   */
  async _getDeviceTokens(driverId) {
    const snapshot = await db.ref(`deviceTokens/${driverId}`).once('value');
    if (!snapshot.exists()) {
      return [];
    }

    // Tokens are stored as { tokenString: true }
    return Object.keys(snapshot.val());
  }

  /**
   * Remove an invalid FCM token from RTDB.
   * @private
   */
  async _removeDeviceToken(driverId, token) {
    try {
      await db.ref(`deviceTokens/${driverId}/${token}`).remove();
      logger.debug({ driverId }, 'Removed invalid FCM token');
    } catch (error) {
      logger.error({ error: error.message, driverId }, 'Failed to remove FCM token');
    }
  }
}

module.exports = NotificationService;
