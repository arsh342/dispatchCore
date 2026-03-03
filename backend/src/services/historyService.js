/**
 * History Service
 *
 * Provides role-scoped delivery history.
 * Dispatchers see full order details (customer info, pricing, all events).
 * Drivers see only their own deliveries with limited fields.
 *
 * Field projection per role is defined in system_design.md §6.3.
 */

const { Op } = require('sequelize');
const { Assignment, Order, Driver, Vehicle, User, DeliveryEvent, Company } = require('../models');
const { ROLES } = require('../utils/constants');
const logger = require('../config/logger');

// Field projections per role
const DISPATCHER_ORDER_FIELDS = [
    'id', 'tracking_code', 'status', 'listed_price', 'weight_kg',
    'pickup_lat', 'pickup_lng', 'pickup_address',
    'delivery_lat', 'delivery_lng', 'delivery_address',
    'priority', 'notes', 'created_at', 'updated_at',
];

const DRIVER_ORDER_FIELDS = [
    'id', 'tracking_code', 'status',
    'pickup_address', 'delivery_address',
    'created_at', 'updated_at',
];

const INDEPENDENT_DRIVER_ORDER_FIELDS = [
    'id', 'tracking_code', 'status', 'listed_price',
    'pickup_address', 'delivery_address',
    'created_at', 'updated_at',
];

class HistoryService {
    /**
     * Get delivery history for a dispatcher — full details, company-scoped.
     *
     * @param {number} companyId
     * @param {object} filters - Optional filters { status, dateFrom, dateTo, page, limit }
     * @returns {Promise<{ records: object[], meta: object }>}
     */
    async getDispatcherHistory(companyId, filters = {}) {
        const { where, pagination } = this._buildQuery(filters);

        const { rows, count } = await Assignment.findAndCountAll({
            include: [
                {
                    model: Order,
                    as: 'order',
                    attributes: DISPATCHER_ORDER_FIELDS,
                    where: { company_id: companyId, ...where },
                },
                {
                    model: Driver,
                    as: 'driver',
                    attributes: ['id', 'type', 'status', 'license_number'],
                    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'phone'] }],
                },
                {
                    model: Vehicle,
                    as: 'vehicle',
                    attributes: ['id', 'plate_number', 'type'],
                },
                {
                    model: User,
                    as: 'assignedByUser',
                    attributes: ['id', 'name'],
                },
                {
                    model: DeliveryEvent,
                    as: 'events',
                    attributes: ['id', 'event_type', 'timestamp', 'notes', 'photo_url'],
                    order: [['timestamp', 'ASC']],
                },
            ],
            order: [['created_at', 'DESC']],
            ...pagination,
            distinct: true,
        });

        // Include customer info for dispatchers
        for (const assignment of rows) {
            if (assignment.order && assignment.order.customer_id) {
                const customer = await User.findByPk(assignment.order.customer_id, {
                    attributes: ['id', 'name', 'phone', 'email'],
                });
                assignment.dataValues.customer = customer;
            }
        }

        return {
            records: rows,
            meta: {
                total: count,
                page: pagination.page || 1,
                limit: pagination.limit || 20,
                totalPages: Math.ceil(count / (pagination.limit || 20)),
            },
        };
    }

    /**
     * Get delivery history for a driver — limited fields, own deliveries only.
     *
     * @param {number} driverId
     * @param {string} driverType - 'EMPLOYED' or 'INDEPENDENT'
     * @param {object} filters - Optional filters
     * @returns {Promise<{ records: object[], meta: object }>}
     */
    async getDriverHistory(driverId, driverType, filters = {}) {
        const { where, pagination } = this._buildQuery(filters);

        const orderFields =
            driverType === 'INDEPENDENT' ? INDEPENDENT_DRIVER_ORDER_FIELDS : DRIVER_ORDER_FIELDS;

        const includes = [
            {
                model: Order,
                as: 'order',
                attributes: orderFields,
                where: Object.keys(where).length > 0 ? where : undefined,
            },
            {
                model: DeliveryEvent,
                as: 'events',
                attributes: ['id', 'event_type', 'timestamp', 'notes'],
                order: [['timestamp', 'ASC']],
            },
        ];

        // Employed drivers can see vehicle info
        if (driverType === 'EMPLOYED') {
            includes.push({
                model: Vehicle,
                as: 'vehicle',
                attributes: ['id', 'plate_number', 'type'],
            });
        }

        const { rows, count } = await Assignment.findAndCountAll({
            where: { driver_id: driverId },
            include: includes,
            order: [['created_at', 'DESC']],
            ...pagination,
            distinct: true,
        });

        return {
            records: rows,
            meta: {
                total: count,
                page: pagination.page || 1,
                limit: pagination.limit || 20,
                totalPages: Math.ceil(count / (pagination.limit || 20)),
            },
        };
    }

    /**
     * Get a single delivery's details (role-scoped).
     *
     * @param {number} assignmentId
     * @param {string} role - User role for field projection
     * @param {number|null} driverId - Required for driver role
     * @returns {Promise<Assignment|null>}
     */
    async getDeliveryDetail(assignmentId, role, driverId = null) {
        const isDispatcher = role === ROLES.DISPATCHER || role === ROLES.ADMIN;
        const orderFields = isDispatcher ? DISPATCHER_ORDER_FIELDS : DRIVER_ORDER_FIELDS;

        const whereClause = { id: assignmentId };
        if (!isDispatcher && driverId) {
            whereClause.driver_id = driverId;
        }

        return Assignment.findOne({
            where: whereClause,
            include: [
                { model: Order, as: 'order', attributes: orderFields },
                {
                    model: DeliveryEvent,
                    as: 'events',
                    attributes: ['id', 'event_type', 'timestamp', 'notes', 'photo_url'],
                },
                {
                    model: Driver,
                    as: 'driver',
                    attributes: ['id', 'type'],
                    include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
                },
            ],
        });
    }

    /**
     * Build WHERE clause and pagination from filter parameters.
     * @private
     */
    _buildQuery(filters) {
        const where = {};
        const pagination = {};

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.dateFrom || filters.dateTo) {
            where.created_at = {};
            if (filters.dateFrom) {
                where.created_at[Op.gte] = new Date(filters.dateFrom);
            }
            if (filters.dateTo) {
                where.created_at[Op.lte] = new Date(filters.dateTo);
            }
        }

        const page = parseInt(filters.page, 10) || 1;
        const limit = parseInt(filters.limit, 10) || 20;
        pagination.limit = limit;
        pagination.offset = (page - 1) * limit;
        pagination.page = page;

        return { where, pagination };
    }
}

module.exports = HistoryService;
