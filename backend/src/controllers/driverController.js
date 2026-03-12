/**
 * Driver Controller
 *
 * Handles driver listing, profile, verification, route registration,
 * and nearby driver queries.
 */

const { Driver, Vehicle, Company } = require('../models');
const { success } = require('../utils/response');
const { NotFoundError, ConflictError, UnauthorizedError } = require('../utils/errors');
const { DRIVER_TYPE } = require('../utils/constants');
const { hashPassword, verifyPassword } = require('../utils/password');
const { serializeDriver } = require('../utils/driverSerializer');

const defaultNotificationPreferences = {
  new_job_alerts: true,
  bid_updates: true,
  delivery_reminders: true,
  earnings_updates: false,
  dispatcher_messages: true,
  promotions: false,
};

const defaultAppearancePreferences = {
  theme: 'dark',
};

const ensureDriverAccess = (req, driver) => {
  const actorDriverId = req.headers['x-driver-id']
    ? parseInt(req.headers['x-driver-id'], 10)
    : null;
  const actorCompanyId = req.headers['x-company-id']
    ? parseInt(req.headers['x-company-id'], 10)
    : null;

  if (actorDriverId && actorDriverId === driver.id) {
    return;
  }

  if (actorCompanyId && driver.company_id && actorCompanyId === driver.company_id) {
    return;
  }

  throw new UnauthorizedError('You do not have access to update this driver');
};

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
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'plate_number', 'type', 'capacity_kg', 'status'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return success(res, drivers.map(serializeDriver));
  } catch (error) {
    next(error);
  }
};

const getDriverById = async (req, res, next) => {
  try {
    const driver = await Driver.findByPk(req.params.id, {
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'address'],
          required: false,
        },
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

    return success(res, serializeDriver(driver));
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
 * Driver identity is stored directly on the drivers table.
 */
const createDriver = async (req, res, next) => {
  try {
    const { name, email, phone, password, license_number, vehicle_type, plate_number, capacity_kg } =
      req.body;

    const existingDriver = await Driver.findOne({ where: { email } });
    if (existingDriver) {
      throw new ConflictError('A driver with this email already exists');
    }

    const existingCompany = await Company.findOne({ where: { email } });
    if (existingCompany) {
      throw new ConflictError('This email is already used by a company account');
    }

    const driver = await Driver.create({
      name,
      email,
      phone: phone || null,
      password_hash: hashPassword(password),
      company_id: req.tenantId,
      type: DRIVER_TYPE.EMPLOYED,
      status: 'OFFLINE',
      verification_status: 'VERIFIED', // employed drivers auto-verified
      license_number: license_number || null,
      notification_preferences: defaultNotificationPreferences,
      appearance_preferences: defaultAppearancePreferences,
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
        driver: serializeDriver(driver),
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

const createIndependentDriver = async (req, res, next) => {
  try {
    const { name, email, phone, password, license_number } = req.body;

    const existingDriver = await Driver.findOne({ where: { email } });
    if (existingDriver) {
      throw new ConflictError('A driver with this email already exists');
    }

    const existingCompany = await Company.findOne({ where: { email } });
    if (existingCompany) {
      throw new ConflictError('This email is already used by a company account');
    }

    const driver = await Driver.create({
      name,
      email,
      phone: phone || null,
      password_hash: hashPassword(password),
      company_id: null,
      type: DRIVER_TYPE.INDEPENDENT,
      status: 'OFFLINE',
      verification_status: 'PENDING',
      license_number: license_number || null,
      notification_preferences: defaultNotificationPreferences,
      appearance_preferences: defaultAppearancePreferences,
    });

    return success(res, serializeDriver(driver), null, 201);
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

    // Enforce valid state transitions
    const allowedTransitions = {
      OFFLINE: ['AVAILABLE'],
      AVAILABLE: ['BUSY', 'OFFLINE'],
      BUSY: ['AVAILABLE', 'OFFLINE'],
    };

    const allowed = allowedTransitions[driver.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot transition from ${driver.status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}`,
        },
      });
    }

    await driver.update({ status });
    return res.json({ success: true, data: { id: driver.id, status: driver.status } });
  } catch (error) {
    next(error);
  }
};

const updateDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findByPk(req.params.id, {
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'address'],
          required: false,
        },
        { model: Vehicle, as: 'vehicle' },
      ],
    });

    if (!driver) {
      throw new NotFoundError('Driver');
    }

    ensureDriverAccess(req, driver);

    const {
      name,
      email,
      phone,
      license_number,
      notification_preferences,
      appearance_preferences,
    } = req.body;

    if (email && email.trim().toLowerCase() !== driver.email) {
      const existingDriver = await Driver.findOne({
        where: { email: email.trim().toLowerCase() },
      });
      if (existingDriver && existingDriver.id !== driver.id) {
        throw new ConflictError('A driver with this email already exists');
      }

      const existingCompany = await Company.findOne({
        where: { email: email.trim().toLowerCase() },
      });
      if (existingCompany) {
        throw new ConflictError('This email is already used by a company account');
      }
    }

    await driver.update({
      name: name ?? driver.name,
      email: email ? email.trim().toLowerCase() : driver.email,
      phone: phone ?? driver.phone,
      license_number: license_number ?? driver.license_number,
      notification_preferences:
        notification_preferences ?? driver.notification_preferences ?? defaultNotificationPreferences,
      appearance_preferences:
        appearance_preferences ?? driver.appearance_preferences ?? defaultAppearancePreferences,
    });

    await driver.reload({
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'address'],
          required: false,
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'plate_number', 'type', 'capacity_kg', 'status'],
          required: false,
        },
      ],
    });

    return success(res, serializeDriver(driver));
  } catch (error) {
    next(error);
  }
};

const updateDriverPassword = async (req, res, next) => {
  try {
    const driver = await Driver.findByPk(req.params.id);

    if (!driver) {
      throw new NotFoundError('Driver');
    }

    ensureDriverAccess(req, driver);

    const { current_password, new_password } = req.body;

    if (!verifyPassword(current_password, driver.password_hash)) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    await driver.update({
      password_hash: hashPassword(new_password),
    });

    return success(res, { updated: true });
  } catch (error) {
    next(error);
  }
};

const updateDriverVehicle = async (req, res, next) => {
  try {
    const driver = await Driver.findByPk(req.params.id, {
      include: [{ model: Vehicle, as: 'vehicle' }],
    });

    if (!driver) {
      throw new NotFoundError('Driver');
    }

    ensureDriverAccess(req, driver);

    const { type, plate_number, capacity_kg, status } = req.body;

    if (!driver.vehicle) {
      const vehicle = await Vehicle.create({
        driver_id: driver.id,
        company_id: driver.company_id ?? null,
        type,
        plate_number,
        capacity_kg,
        status: status ?? 'ACTIVE',
      });
      return success(res, vehicle, null, 201);
    }

    if (plate_number && plate_number !== driver.vehicle.plate_number) {
      const existingVehicle = await Vehicle.findOne({ where: { plate_number } });
      if (existingVehicle && existingVehicle.id !== driver.vehicle.id) {
        throw new ConflictError('A vehicle with this plate number already exists');
      }
    }

    await driver.vehicle.update({
      type: type ?? driver.vehicle.type,
      plate_number: plate_number ?? driver.vehicle.plate_number,
      capacity_kg: capacity_kg ?? driver.vehicle.capacity_kg,
      status: status ?? driver.vehicle.status,
      company_id: driver.company_id ?? null,
    });

    return success(res, driver.vehicle);
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
  createIndependentDriver,
  updateDriverStatus,
  getMyRoutes,
  deactivateRoute,
  getActiveRoutesForDispatchers,
  updateDriver,
  updateDriverPassword,
  updateDriverVehicle,
};
