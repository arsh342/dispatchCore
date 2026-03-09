/**
 * Driver Controller
 *
 * Handles driver listing, profile, verification, route registration,
 * and nearby driver queries.
 */

const { Driver, User, Vehicle } = require('../models');
const { success } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');
const { DRIVER_TYPE } = require('../utils/constants');

const getDrivers = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const where = { company_id: req.tenantId };

    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }

    const drivers = await Driver.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'plate_number', 'type', 'capacity_kg', 'status'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return success(res, drivers);
  } catch (error) {
    next(error);
  }
};

const getDriverById = async (req, res, next) => {
  try {
    const driver = await Driver.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'plate_number', 'type', 'capacity_kg', 'status'],
        },
      ],
    });

    if (!driver) {
      throw new NotFoundError('Driver');
    }

    return success(res, driver);
  } catch (error) {
    next(error);
  }
};

const verifyDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findByPk(req.params.id);

    if (!driver) {
      throw new NotFoundError('Driver');
    }

    const { verification_status } = req.body;
    await driver.update({ verification_status });

    return success(res, driver);
  } catch (error) {
    next(error);
  }
};

const registerRoute = async (req, res, next) => {
  try {
    const { start_lat, start_lng, end_lat, end_lng, departure_time, start_address, end_address } =
      req.body;
    const routeMatchingService = req.app.get('routeMatchingService');

    // CE-02: Replace with driver ID from JWT
    const driverId = parseInt(req.headers['x-driver-id'], 10);

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

/**
 * GET /api/drivers/routes/mine — Driver's own routes
 */
const getMyRoutes = async (req, res, next) => {
  try {
    const routeMatchingService = req.app.get('routeMatchingService');
    const driverId = parseInt(req.headers['x-driver-id'], 10);
    if (!driverId) return success(res, []);
    const routes = await routeMatchingService.getDriverRoutes(driverId);
    return success(res, routes);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/drivers/routes/:routeId — Deactivate a route
 */
const deactivateRoute = async (req, res, next) => {
  try {
    const routeMatchingService = req.app.get('routeMatchingService');
    await routeMatchingService.deactivateRoute(parseInt(req.params.routeId, 10));
    return success(res, { message: 'Route deactivated' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/drivers/routes/active — All active routes (for dispatchers)
 */
const getActiveRoutesForDispatchers = async (req, res, next) => {
  try {
    const routeMatchingService = req.app.get('routeMatchingService');
    const routes = await routeMatchingService.getActiveRoutes();
    return success(res, routes);
  } catch (error) {
    next(error);
  }
};

/**
 * Create an employed driver under the current company.
 * Creates a User record + linked Driver profile.
 */
const createDriver = async (req, res, next) => {
  try {
    const { name, email, phone, license_number, vehicle_type, plate_number, capacity_kg } =
      req.body;

    // Create user record first
    const user = await User.create({
      name,
      email,
      phone: phone || null,
      company_id: req.tenantId,
      role: 'dispatcher', // closest available role — drivers are tracked via Driver model
    });

    // Create driver profile
    const driver = await Driver.create({
      user_id: user.id,
      company_id: req.tenantId,
      type: DRIVER_TYPE.EMPLOYED,
      status: 'OFFLINE',
      verification_status: 'VERIFIED', // employed drivers auto-verified
      license_number: license_number || null,
    });

    // Create vehicle if vehicle_type is provided
    let vehicle = null;
    if (vehicle_type) {
      vehicle = await Vehicle.create({
        company_id: req.tenantId,
        driver_id: driver.id,
        plate_number: plate_number || `VH-${driver.id}`,
        type: vehicle_type,
        capacity_kg:
          capacity_kg || (vehicle_type === 'TRUCK' ? 5000 : vehicle_type === 'VAN' ? 1000 : 100),
        status: 'ACTIVE',
      });
    }

    return success(
      res,
      {
        driver,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
        vehicle: vehicle
          ? { id: vehicle.id, type: vehicle.type, plate_number: vehicle.plate_number }
          : null,
      },
      null,
      201,
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update a driver's status (AVAILABLE, OFFLINE, BUSY)
 */
const updateDriverStatus = async (req, res, next) => {
  try {
    const { Driver } = require('../models');
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, error: { message: 'Driver not found' } });
    }
    const { status } = req.body;
    const validStatuses = ['AVAILABLE', 'OFFLINE', 'BUSY'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: `Status must be one of: ${validStatuses.join(', ')}` },
      });
    }
    await driver.update({ status });
    return res.json({ success: true, data: { id: driver.id, status: driver.status } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDrivers,
  getDriverById,
  verifyDriver,
  registerRoute,
  findNearbyDrivers,
  createDriver,
  updateDriverStatus,
  getMyRoutes,
  deactivateRoute,
  getActiveRoutesForDispatchers,
};
