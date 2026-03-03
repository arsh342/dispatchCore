/**
 * Driver Controller
 *
 * Handles driver listing, profile, verification, route registration,
 * and nearby driver queries.
 */

const { Driver, User } = require('../models');
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
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
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
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
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
        const { start_lat, start_lng, end_lat, end_lng, departure_time } = req.body;
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

module.exports = { getDrivers, getDriverById, verifyDriver, registerRoute, findNearbyDrivers };
