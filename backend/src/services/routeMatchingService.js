/**
 * Route Matching Service
 *
 * Matches independent drivers whose pre-registered travel routes
 * pass near a given order's delivery path.
 *
 * Uses the Haversine formula to calculate great-circle distance
 * between two geographic coordinates.
 */

const { Op } = require('sequelize');
const { DriverRoute, Driver } = require('../models');
const { DRIVER_TYPE, VERIFICATION_STATUS } = require('../utils/constants');
const logger = require('../config/logger');

// Earth's radius in kilometers
const EARTH_RADIUS_KM = 6371;

class RouteMatchingService {
    /**
     * Register a new travel route for an independent driver.
     *
     * @param {number} driverId
     * @param {number} startLat
     * @param {number} startLng
     * @param {number} endLat
     * @param {number} endLng
     * @param {Date} departureTime
     * @returns {Promise<DriverRoute>}
     */
    async registerRoute(driverId, startLat, startLng, endLat, endLng, departureTime) {
        const route = await DriverRoute.create({
            driver_id: driverId,
            start_lat: startLat,
            start_lng: startLng,
            end_lat: endLat,
            end_lng: endLng,
            departure_time: departureTime,
            is_active: true,
        });

        logger.info('Driver route registered', { driverId, routeId: route.id });

        return route;
    }

    /**
     * Deactivate a route (e.g., after the trip is completed).
     *
     * @param {number} routeId
     * @returns {Promise<void>}
     */
    async deactivateRoute(routeId) {
        const route = await DriverRoute.findByPk(routeId);

        if (route) {
            await route.update({ is_active: false });
            logger.info('Driver route deactivated', { routeId });
        }
    }

    /**
     * Find independent drivers whose pre-registered routes pass near
     * the given pickup and delivery locations.
     *
     * A driver is considered "nearby" if:
     *   - Their route's start point is within radiusKm of the pickup point, OR
     *   - Their route's end point is within radiusKm of the delivery point
     *
     * @param {number} pickupLat
     * @param {number} pickupLng
     * @param {number} deliveryLat
     * @param {number} deliveryLng
     * @param {number} radiusKm - Search radius in kilometers (default: 5)
     * @returns {Promise<Driver[]>}
     */
    async findDriversNearPath(pickupLat, pickupLng, deliveryLat, deliveryLng, radiusKm = 5) {
        // Get all active routes departing in the future
        const activeRoutes = await DriverRoute.findAll({
            where: {
                is_active: true,
                departure_time: { [Op.gte]: new Date() },
            },
            include: [
                {
                    model: Driver,
                    as: 'driver',
                    where: {
                        type: DRIVER_TYPE.INDEPENDENT,
                        verification_status: VERIFICATION_STATUS.VERIFIED,
                    },
                },
            ],
        });

        // Filter routes by proximity using Haversine
        const matchingDrivers = [];
        const seenDriverIds = new Set();

        for (const route of activeRoutes) {
            const isAlongRoute = this._isAlongRoute(
                route,
                pickupLat,
                pickupLng,
                deliveryLat,
                deliveryLng,
                radiusKm,
            );

            if (isAlongRoute && !seenDriverIds.has(route.driver_id)) {
                seenDriverIds.add(route.driver_id);
                matchingDrivers.push(route.driver);
            }
        }

        logger.info('Route matching completed', {
            matchedDrivers: matchingDrivers.length,
            totalRoutes: activeRoutes.length,
            radiusKm,
        });

        return matchingDrivers;
    }

    /**
     * Check if a route passes near both the pickup and delivery points.
     * @private
     */
    _isAlongRoute(route, pickupLat, pickupLng, deliveryLat, deliveryLng, radiusKm) {
        const startToPickup = this._calculateDistance(
            parseFloat(route.start_lat),
            parseFloat(route.start_lng),
            pickupLat,
            pickupLng,
        );

        const endToDelivery = this._calculateDistance(
            parseFloat(route.end_lat),
            parseFloat(route.end_lng),
            deliveryLat,
            deliveryLng,
        );

        return startToPickup <= radiusKm || endToDelivery <= radiusKm;
    }

    /**
     * Calculate the great-circle distance between two points using Haversine.
     * @private
     *
     * @param {number} lat1 - Latitude of point 1 (degrees)
     * @param {number} lng1 - Longitude of point 1 (degrees)
     * @param {number} lat2 - Latitude of point 2 (degrees)
     * @param {number} lng2 - Longitude of point 2 (degrees)
     * @returns {number} Distance in kilometers
     */
    _calculateDistance(lat1, lng1, lat2, lng2) {
        const toRad = (deg) => (deg * Math.PI) / 180;

        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c;
    }
}

module.exports = RouteMatchingService;
