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
const { attachLegacyUserShape } = require('../utils/driverSerializer');

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
  async registerRoute(
    driverId,
    startLat,
    startLng,
    endLat,
    endLng,
    departureTime,
    startAddress = null,
    endAddress = null,
  ) {
    const route = await DriverRoute.create({
      driver_id: driverId,
      start_lat: startLat,
      start_lng: startLng,
      end_lat: endLat,
      end_lng: endLng,
      departure_time: departureTime,
      start_address: startAddress,
      end_address: endAddress,
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
   * Get all routes for a specific driver.
   *
   * @param {number} driverId
   * @returns {Promise<DriverRoute[]>}
   */
  async getDriverRoutes(driverId) {
    return DriverRoute.findAll({
      where: { driver_id: driverId },
      order: [['departure_time', 'DESC']],
    });
  }

  /**
   * Get all active routes with driver info (for dispatchers).
   *
   * @returns {Promise<DriverRoute[]>}
   */
  async getActiveRoutes() {
    const routes = await DriverRoute.findAll({
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
          },
          attributes: ['id', 'name', 'email', 'phone', 'type', 'verification_status'],
        },
      ],
      order: [['departure_time', 'ASC']],
    });

    routes.forEach((route) => {
      if (route.driver) {
        attachLegacyUserShape(route.driver);
      }
    });

    return routes;
  }

  /**
   * Find independent drivers whose pre-registered routes pass near
   * the given pickup and delivery locations.
   *
   * Returns granular match info:
   *   - pickupNearStart:    order pickup is near the route's start
   *   - pickupNearEnd:      order pickup is near the route's end
   *   - pickupOnRoute:      order pickup is near the straight-line path
   *   - deliveryNearStart:  order delivery is near the route's start
   *   - deliveryNearEnd:    order delivery is near the route's end
   *   - deliveryOnRoute:    order delivery is near the straight-line path
   *   - matchType:          'full' | 'pickup' | 'delivery' | 'enroute'
   *
   * @param {number} pickupLat
   * @param {number} pickupLng
   * @param {number} deliveryLat
   * @param {number} deliveryLng
   * @param {number} radiusKm - Search radius in kilometers (default: 15)
   * @returns {Promise<Object[]>}
   */
  async findDriversNearPath(pickupLat, pickupLng, deliveryLat, deliveryLng, radiusKm = 15) {
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
          },
          attributes: ['id', 'name', 'email', 'phone', 'type', 'verification_status'],
        },
      ],
    });

    const matchingDrivers = [];
    const seenDriverIds = new Set();

    for (const route of activeRoutes) {
      const rStartLat = parseFloat(route.start_lat);
      const rStartLng = parseFloat(route.start_lng);
      const rEndLat = parseFloat(route.end_lat);
      const rEndLng = parseFloat(route.end_lng);

      // Distances: pickup point relative to route
      const pickupToStart = this._calculateDistance(rStartLat, rStartLng, pickupLat, pickupLng);
      const pickupToEnd = this._calculateDistance(rEndLat, rEndLng, pickupLat, pickupLng);
      const pickupToRoute = this._pointToSegmentDistance(
        pickupLat,
        pickupLng,
        rStartLat,
        rStartLng,
        rEndLat,
        rEndLng,
      );

      // Distances: delivery point relative to route
      const deliveryToStart = this._calculateDistance(
        rStartLat,
        rStartLng,
        deliveryLat,
        deliveryLng,
      );
      const deliveryToEnd = this._calculateDistance(rEndLat, rEndLng, deliveryLat, deliveryLng);
      const deliveryToRoute = this._pointToSegmentDistance(
        deliveryLat,
        deliveryLng,
        rStartLat,
        rStartLng,
        rEndLat,
        rEndLng,
      );

      // Boolean flags
      const pickupNearStart = pickupToStart <= radiusKm;
      const pickupNearEnd = pickupToEnd <= radiusKm;
      const pickupOnRoute = pickupToRoute <= radiusKm;
      const deliveryNearStart = deliveryToStart <= radiusKm;
      const deliveryNearEnd = deliveryToEnd <= radiusKm;
      const deliveryOnRoute = deliveryToRoute <= radiusKm;

      const pickupMatch = pickupNearStart || pickupNearEnd || pickupOnRoute;
      const deliveryMatch = deliveryNearStart || deliveryNearEnd || deliveryOnRoute;

      // Must match at least one of pickup or delivery
      if (!pickupMatch && !deliveryMatch) continue;
      if (seenDriverIds.has(route.driver_id)) continue;
      seenDriverIds.add(route.driver_id);
      attachLegacyUserShape(route.driver);

      // Determine overall match quality
      let matchType = 'enroute';
      if (pickupMatch && deliveryMatch) matchType = 'full';
      else if (pickupMatch) matchType = 'pickup';
      else if (deliveryMatch) matchType = 'delivery';

      matchingDrivers.push({
        driver: route.driver,
        route: {
          id: route.id,
          startAddress: route.start_address,
          endAddress: route.end_address,
          departureTime: route.departure_time,
          startLat: route.start_lat,
          startLng: route.start_lng,
          endLat: route.end_lat,
          endLng: route.end_lng,
        },
        matchType,
        pickupDistance: Math.min(pickupToStart, pickupToEnd, pickupToRoute),
        deliveryDistance: Math.min(deliveryToStart, deliveryToEnd, deliveryToRoute),
        matches: {
          pickupNearStart,
          pickupNearEnd,
          pickupOnRoute,
          deliveryNearStart,
          deliveryNearEnd,
          deliveryOnRoute,
        },
        distances: {
          pickupToStart: Math.round(pickupToStart * 10) / 10,
          pickupToEnd: Math.round(pickupToEnd * 10) / 10,
          pickupToRoute: Math.round(pickupToRoute * 10) / 10,
          deliveryToStart: Math.round(deliveryToStart * 10) / 10,
          deliveryToEnd: Math.round(deliveryToEnd * 10) / 10,
          deliveryToRoute: Math.round(deliveryToRoute * 10) / 10,
        },
      });
    }

    // Sort: full matches first, then pickup, delivery, enroute
    const typeOrder = { full: 0, pickup: 1, delivery: 2, enroute: 3 };
    matchingDrivers.sort((a, b) => (typeOrder[a.matchType] ?? 9) - (typeOrder[b.matchType] ?? 9));

    logger.info('Route matching completed', {
      matchedDrivers: matchingDrivers.length,
      totalRoutes: activeRoutes.length,
      radiusKm,
    });

    return matchingDrivers;
  }

  /**
   * Calculate the shortest distance from a point to a line segment (great-circle approx).
   * Uses projection onto the segment to find the closest point on the route path.
   * @private
   */
  _pointToSegmentDistance(pLat, pLng, aLat, aLng, bLat, bLng) {
    // Convert to radians for vector math
    const toRad = (deg) => (deg * Math.PI) / 180;

    // Approximate using flat-earth projection (good enough for < 500 km segments)
    const midLat = toRad((aLat + bLat) / 2);
    const cosLat = Math.cos(midLat);

    // Convert to km offsets from point A
    const ax = 0,
      ay = 0;
    const bx = (bLng - aLng) * cosLat * 111.32;
    const by = (bLat - aLat) * 111.32;
    const px = (pLng - aLng) * cosLat * 111.32;
    const py = (pLat - aLat) * 111.32;

    // Project point P onto line AB
    const abLenSq = bx * bx + by * by;
    if (abLenSq === 0) {
      // A and B are the same point
      return this._calculateDistance(pLat, pLng, aLat, aLng);
    }

    let t = ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / abLenSq;
    t = Math.max(0, Math.min(1, t)); // clamp to segment

    const closestX = ax + t * (bx - ax);
    const closestY = ay + t * (by - ay);

    const dx = px - closestX;
    const dy = py - closestY;

    return Math.sqrt(dx * dx + dy * dy);
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
