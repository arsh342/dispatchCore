const { Driver, Vehicle, Company } = require('../../models');
const { success } = require('../../utils/response');
const { NotFoundError, ConflictError, ValidationError } = require('../../utils/errors');
const { DRIVER_TYPE } = require('../../utils/constants');
const { hashPassword } = require('../../utils/password');
const { serializeDriver } = require('../../utils/driverSerializer');
const { ensureEmailAvailable } = require('../../utils/emailUniqueness');
const {
  DRIVER_NOTIFICATION_DEFAULTS,
  APPEARANCE_DEFAULTS,
  VEHICLE_CAPACITY_DEFAULTS,
} = require('../../utils/defaults');
const { ensureDriverAccess } = require('./access');

const getDrivers = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const where = { company_id: req.tenantId };

    if (status) where.status = status;
    if (type) where.type = type;

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

    ensureDriverAccess(req, driver);

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

const createDriver = async (req, res, next) => {
  try {
    const { name, email, phone, password, license_number, vehicle_type, plate_number, capacity_kg } =
      req.body;

    await ensureEmailAvailable(email);

    const driver = await Driver.create({
      name,
      email,
      phone: phone || null,
      password_hash: hashPassword(password),
      company_id: req.tenantId,
      type: DRIVER_TYPE.EMPLOYED,
      status: 'OFFLINE',
      verification_status: 'VERIFIED',
      license_number: license_number || null,
      notification_preferences: DRIVER_NOTIFICATION_DEFAULTS,
      appearance_preferences: APPEARANCE_DEFAULTS,
    });

    let vehicle = null;
    if (vehicle_type) {
      vehicle = await Vehicle.create({
        company_id: req.tenantId,
        driver_id: driver.id,
        plate_number: plate_number || `VH-${driver.id}`,
        type: vehicle_type,
        capacity_kg: capacity_kg || (VEHICLE_CAPACITY_DEFAULTS[vehicle_type] ?? 100),
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

    await ensureEmailAvailable(email);

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
      notification_preferences: DRIVER_NOTIFICATION_DEFAULTS,
      appearance_preferences: APPEARANCE_DEFAULTS,
    });

    return success(res, serializeDriver(driver), null, 201);
  } catch (error) {
    next(error);
  }
};

const updateDriverStatus = async (req, res, next) => {
  try {
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) {
      throw new NotFoundError('Driver');
    }

    ensureDriverAccess(req, driver);

    const { status } = req.body;
    const validStatuses = ['AVAILABLE', 'OFFLINE', 'BUSY'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    const allowedTransitions = {
      OFFLINE: ['AVAILABLE'],
      AVAILABLE: ['BUSY', 'OFFLINE'],
      BUSY: ['AVAILABLE', 'OFFLINE'],
    };

    const allowed = allowedTransitions[driver.status] || [];
    if (!allowed.includes(status)) {
      throw new ConflictError(
        `Cannot transition from ${driver.status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    await driver.update({ status });
    return success(res, { id: driver.id, status: driver.status });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDrivers,
  getDriverById,
  verifyDriver,
  createDriver,
  createIndependentDriver,
  updateDriverStatus,
};
