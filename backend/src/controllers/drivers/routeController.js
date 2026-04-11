const { success } = require('../../utils/response');
const { DriverRoute } = require('../../models');
const { ForbiddenError, NotFoundError } = require('../../utils/errors');

const registerRoute = async (req, res, next) => {
  try {
    const { start_lat, start_lng, end_lat, end_lng, departure_time, start_address, end_address } =
      req.body;
    const routeMatchingService = req.app.get('routeMatchingService');
    const driverId = req.identity?.driverId ?? null;

    const route = await routeMatchingService.registerRoute(
      driverId,
      start_lat,
      start_lng,
      end_lat,
      end_lng,
      departure_time,
      start_address || null,
      end_address || null,
    );

    return success(res, route, null, 201);
  } catch (error) {
    next(error);
  }
};

const findNearbyDrivers = async (req, res, next) => {
  try {
    const { pickup_lat, pickup_lng, delivery_lat, delivery_lng, radius_km } = req.query;
    const routeMatchingService = req.app.get('routeMatchingService');

    const drivers = await routeMatchingService.findDriversNearPath(
      parseFloat(pickup_lat),
      parseFloat(pickup_lng),
      parseFloat(delivery_lat),
      parseFloat(delivery_lng),
      radius_km ? parseFloat(radius_km) : 5,
    );

    return success(res, drivers);
  } catch (error) {
    next(error);
  }
};

const getMyRoutes = async (req, res, next) => {
  try {
    const routeMatchingService = req.app.get('routeMatchingService');
    const driverId = req.identity?.driverId ?? null;
    if (!driverId) return success(res, []);
    const routes = await routeMatchingService.getDriverRoutes(driverId);
    return success(res, routes);
  } catch (error) {
    next(error);
  }
};

const deactivateRoute = async (req, res, next) => {
  try {
    const routeMatchingService = req.app.get('routeMatchingService');
    const routeId = parseInt(req.params.routeId, 10);
    const driverId = req.identity?.driverId ?? null;

    const route = await DriverRoute.findByPk(routeId);
    if (!route) {
      throw new NotFoundError('Route');
    }

    if (!driverId || route.driver_id !== driverId) {
      throw new ForbiddenError('You can only deactivate your own routes');
    }

    await routeMatchingService.deactivateRoute(routeId);
    return success(res, { message: 'Route deactivated' });
  } catch (error) {
    next(error);
  }
};

const getActiveRoutesForDispatchers = async (req, res, next) => {
  try {
    const routeMatchingService = req.app.get('routeMatchingService');
    const routes = await routeMatchingService.getActiveRoutes();
    return success(res, routes);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerRoute,
  findNearbyDrivers,
  getMyRoutes,
  deactivateRoute,
  getActiveRoutesForDispatchers,
};
