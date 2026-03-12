/**
 * History Service
 *
 * Provides role-scoped delivery history.
 * Dispatchers see full order details (recipient info, pricing, all events).
 * Drivers see only their own deliveries with limited fields.
 *
 * Field projection per role is defined in system_design.md §6.3.
 */

const { Op } = require('sequelize');
const { Assignment, Order, Driver, Vehicle, DeliveryEvent, Company, Bid } = require('../models');
const { ROLES } = require('../utils/constants');
const logger = require('../config/logger');
const { attachLegacyUserShape } = require('../utils/driverSerializer');

// Field projections per role
const DISPATCHER_ORDER_FIELDS = [
  'id',
  'tracking_code',
  'status',
  'listed_price',
  'weight_kg',
  'pickup_lat',
  'pickup_lng',
  'pickup_address',
  'delivery_lat',
  'delivery_lng',
  'delivery_address',
  'priority',
  'recipient_name',
  'recipient_phone',
  'recipient_email',
  'notes',
  'created_at',
  'updated_at',
];

const DRIVER_ORDER_FIELDS = [
  'id',
  'tracking_code',
  'status',
  'pickup_lat',
  'pickup_lng',
  'pickup_address',
  'delivery_lat',
  'delivery_lng',
  'delivery_address',
  'recipient_name',
  'recipient_phone',
  'recipient_email',
  'created_at',
  'updated_at',
];

const INDEPENDENT_DRIVER_ORDER_FIELDS = [
  'id',
  'tracking_code',
  'status',
  'listed_price',
  'weight_kg',
  'priority',
  'pickup_lat',
  'pickup_lng',
  'pickup_address',
  'delivery_lat',
  'delivery_lng',
  'delivery_address',
  'recipient_name',
  'recipient_phone',
  'recipient_email',
  'notes',
  'company_id',
  'created_at',
  'updated_at',
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
          attributes: ['id', 'name', 'email', 'phone', 'type', 'status', 'license_number'],
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'plate_number', 'type'],
        },
        {
          model: Company,
          as: 'assignedByCompany',
          attributes: ['id', 'name', 'email'],
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

    for (const assignment of rows) {
      if (assignment.driver) {
        attachLegacyUserShape(assignment.driver);
      }
      if (assignment.order) {
        assignment.dataValues.recipient = {
          name: assignment.order.recipient_name || null,
          phone: assignment.order.recipient_phone || null,
          email: assignment.order.recipient_email || null,
        };
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

    // Include the accepted bid so frontend can use offered_price for earnings
    // Bids are linked via order_id + driver_id
    // We'll include them via the Order → Bid association filtered to ACCEPTED
    includes[0].include = [
      {
        model: Bid,
        as: 'bids',
        where: { status: 'ACCEPTED' },
        required: false,
        attributes: ['id', 'offered_price', 'status'],
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

    // Include the assigning company name
    includes.push({
      model: Company,
      as: 'assignedByCompany',
      attributes: ['id', 'name'],
    });

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
    const isDispatcher = role === ROLES.DISPATCHER;
    const orderFields = isDispatcher ? DISPATCHER_ORDER_FIELDS : DRIVER_ORDER_FIELDS;

    const whereClause = { id: assignmentId };
    if (!isDispatcher && driverId) {
      whereClause.driver_id = driverId;
    }

    const assignment = await Assignment.findOne({
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
          attributes: ['id', 'name', 'email', 'phone', 'type'],
        },
      ],
    });

    if (assignment?.driver) {
      attachLegacyUserShape(assignment.driver);
    }

    return assignment;
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
