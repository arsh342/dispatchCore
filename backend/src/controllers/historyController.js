/**
 * History Controller
 *
 * Role-scoped delivery history with pagination.
 * Dispatchers see full details; drivers see limited fields.
 */

const { success } = require('../utils/response');
const { ROLES } = require('../utils/constants');
const { Driver } = require('../models');

const getHistory = async (req, res, next) => {
    try {
        const historyService = req.app.get('historyService');
        const { status, dateFrom, dateTo, page, limit } = req.query;
        const filters = { status, dateFrom, dateTo, page, limit };

        // CE-02: Replace with req.user from JWT
        const role = req.headers['x-user-role'] || ROLES.DISPATCHER;
        const driverId = req.headers['x-driver-id']
            ? parseInt(req.headers['x-driver-id'], 10)
            : null;

        let result;

        if (role === ROLES.DISPATCHER || role === ROLES.ADMIN || role === ROLES.SUPERADMIN) {
            result = await historyService.getDispatcherHistory(req.tenantId, filters);
        } else if (driverId) {
            const driver = await Driver.findByPk(driverId);
            const driverType = driver ? driver.type : 'EMPLOYED';
            result = await historyService.getDriverHistory(driverId, driverType, filters);
        } else {
            result = { records: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
        }

        return success(res, result.records, result.meta);
    } catch (error) {
        next(error);
    }
};

const getDeliveryDetail = async (req, res, next) => {
    try {
        const historyService = req.app.get('historyService');

        const role = req.headers['x-user-role'] || ROLES.DISPATCHER;
        const driverId = req.headers['x-driver-id']
            ? parseInt(req.headers['x-driver-id'], 10)
            : null;

        const record = await historyService.getDeliveryDetail(
            parseInt(req.params.assignmentId, 10),
            role,
            driverId,
        );

        if (!record) {
            const { NotFoundError } = require('../utils/errors');
            throw new NotFoundError('Delivery record');
        }

        return success(res, record);
    } catch (error) {
        next(error);
    }
};

module.exports = { getHistory, getDeliveryDetail };
