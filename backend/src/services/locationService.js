/**
 * Location Service
 *
 * Handles GPS ping persistence and location broadcasting.
 * Writes to both:
 *   - MySQL (DriverLocationLog) — historical audit trail
 *   - Firebase RTDB (/locations/{driverId}) — real-time tracking
 *
 * Visibility rules are no longer enforced server-side via Socket.io rooms.
 * Instead, Firebase RTDB Security Rules control who can read each location path.
 */

const { DriverLocationLog } = require('../models');
const logger = require('../config/logger');

class LocationService {
    constructor(realtime) {
        this.realtime = realtime; // RealtimeService instance (injected)
    }

    /**
     * Record a GPS ping: persist to MySQL and broadcast via RTDB.
     *
     * @param {number} driverId
     * @param {number} lat
     * @param {number} lng
     * @param {number|null} speed
     * @param {number|null} heading
     * @returns {Promise<DriverLocationLog>}
     */
    async recordPing(driverId, lat, lng, speed = null, heading = null) {
        // Persist to MySQL for historical audit trail
        const locationLog = await DriverLocationLog.create({
            driver_id: driverId,
            lat,
            lng,
            speed,
            heading,
            recorded_at: new Date(),
        });

        logger.debug({ driverId, lat, lng }, 'GPS ping recorded');

        // Broadcast via Firebase RTDB (replaces Socket.io room-based broadcast)
        if (this.realtime) {
            await this.realtime.updateDriverLocation(driverId, { lat, lng, speed, heading });
        }

        return locationLog;
    }

    /**
     * Get the latest recorded location for a driver from MySQL.
     *
     * @param {number} driverId
     * @returns {Promise<DriverLocationLog|null>}
     */
    async getLatestLocation(driverId) {
        return DriverLocationLog.findOne({
            where: { driver_id: driverId },
            order: [['recorded_at', 'DESC']],
        });
    }
}

module.exports = LocationService;
