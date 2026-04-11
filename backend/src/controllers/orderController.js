/**
 * Order Controller
 *
 * Handles order CRUD, marketplace listing, and direct assignment.
 * All queries are tenant-scoped via req.tenantId.
 */

const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { Order, Bid, Assignment, DeliveryEvent, Driver, Vehicle } = require('../models');
const { success } = require('../utils/response');
const { NotFoundError, ConflictError, ForbiddenError } = require('../utils/errors');
const { ORDER_STATUS } = require('../utils/constants');
const { attachLegacyUserShape } = require('../utils/driverSerializer');

const createOrder = async (req, res, next) => {
  try {
    const {
      pickup_lat,
      pickup_lng,
      pickup_address,
      delivery_lat,
      delivery_lng,
      delivery_address,
      priority,
      weight_kg,
      notes,
      recipient_name,
      recipient_phone,
      recipient_email,
    } = req.body;

    const order = await Order.create({
      company_id: req.tenantId,
      tracking_code: uuidv4(),
      status: ORDER_STATUS.UNASSIGNED,
      pickup_lat,
      pickup_lng,
      pickup_address,
      delivery_lat,
      delivery_lng,
      delivery_address,
      priority: priority || 'NORMAL',
      weight_kg,
      notes,
      recipient_name: recipient_name || null,
      recipient_phone: recipient_phone || null,
      recipient_email: recipient_email || null,
    });

    return success(res, order, null, 201);
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    const where = { company_id: req.tenantId };

    if (status) {
      // Support comma-separated statuses, e.g. ?status=UNASSIGNED,LISTED
      const statuses = status
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      where.status = statuses.length === 1 ? statuses[0] : { [Op.in]: statuses };
    }
    if (priority) {
      where.priority = priority;
    }

    // Only filter by driver when explicitly requested via query param
    // (used by driver views, NOT dispatcher dashboard)
    const { for_driver } = req.query;
    if (for_driver) {
      const driverIdToFilter = parseInt(for_driver, 10);
      if (!isNaN(driverIdToFilter)) {
        const assignments = await Assignment.findAll({
          where: { driver_id: driverIdToFilter },
          attributes: ['order_id'],
          raw: true,
        });
        const assignedOrderIds = assignments.map((a) => a.order_id);
        if (assignedOrderIds.length > 0) {
          where.id = assignedOrderIds;
        } else {
          return success(res, [], { total: 0, page: 1, limit: parseInt(limit, 10), totalPages: 0 });
        }
      }
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { rows, count } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: Assignment,
          as: 'assignment',
          required: false,
          attributes: ['id', 'driver_id', 'vehicle_id', 'source'],
          include: [
            {
              model: Driver,
              as: 'driver',
              attributes: ['id', 'name', 'email', 'phone', 'type', 'status'],
            },
            {
              model: Vehicle,
              as: 'vehicle',
              attributes: ['id', 'plate_number', 'type'],
            },
          ],
        },
        {
          model: Bid,
          as: 'bids',
          where: { status: 'ACCEPTED' },
          required: false,
          attributes: ['id', 'offered_price', 'status'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset,
    });

    rows.forEach((row) => {
      if (row.assignment?.driver) {
        attachLegacyUserShape(row.assignment.driver);
      }
    });

    return success(res, rows, {
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(count / parseInt(limit, 10)),
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, company_id: req.tenantId },
      include: [{ model: Bid, as: 'bids' }],
    });

    if (!order) {
      throw new NotFoundError('Order');
    }

    return success(res, order);
  } catch (error) {
    next(error);
  }
};

const listOrderOnMarketplace = async (req, res, next) => {
  try {
    const { listed_price } = req.body;
    const marketplaceService = req.app.get('marketplaceService');
    const order = await marketplaceService.listOrder(parseInt(req.params.id, 10), listed_price);

    return success(res, order);
  } catch (error) {
    next(error);
  }
};

const unlistOrder = async (req, res, next) => {
  try {
    const marketplaceService = req.app.get('marketplaceService');
    const order = await marketplaceService.unlistOrder(parseInt(req.params.id, 10));

    return success(res, order);
  } catch (error) {
    next(error);
  }
};

const assignOrder = async (req, res, next) => {
  try {
    const { driver_id, vehicle_id, route_match } = req.body;
    const assignmentService = req.app.get('assignmentService');

    const companyId = req.tenantId;

    const assignment = await assignmentService.assignOrder(
      parseInt(req.params.id, 10),
      driver_id,
      vehicle_id || null,
      companyId,
      { allowBusy: !!route_match },
    );

    return success(res, assignment, null, 201);
  } catch (error) {
    next(error);
  }
};

const getOrderBids = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, company_id: req.tenantId },
    });

    if (!order) {
      throw new NotFoundError('Order');
    }

    const bids = await Bid.findAll({
      where: { order_id: req.params.id },
      include: [
        {
          model: Driver,
          as: 'driver',
          attributes: ['id', 'name', 'email', 'phone', 'type'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return success(res, bids);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/orders/:id/status — Update order status (driver action)
 * Valid transitions: ASSIGNED→PICKED_UP, PICKED_UP→EN_ROUTE, EN_ROUTE→DELIVERED
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const driverId = req.identity?.driverId ?? null;
    if (!driverId) {
      throw new ForbiddenError('Driver identity is required to update order status');
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      throw new NotFoundError('Order');
    }

    const assignment = await Assignment.findOne({ where: { order_id: order.id, driver_id: driverId } });
    if (!assignment) {
      throw new ForbiddenError('You are not assigned to this order');
    }
    // Validate status transition
    const validTransitions = {
      ASSIGNED: ['PICKED_UP'],
      PICKED_UP: ['EN_ROUTE'],
      EN_ROUTE: ['DELIVERED'],
    };

    const allowed = validTransitions[order.status] ?? [];
    if (!allowed.includes(status)) {
      throw new ConflictError(`Cannot transition from "${order.status}" to "${status}"`);
    }

    await order.update({ status });

    // Record delivery event for audit trail
    const orderAssignment = await Assignment.findOne({ where: { order_id: order.id } });
    if (orderAssignment) {
      await DeliveryEvent.create({
        assignment_id: orderAssignment.id,
        event_type: status,
        timestamp: new Date(),
      });
    }

    // If delivered, free the driver
    if (status === 'DELIVERED') {
      if (orderAssignment) {
        await Driver.update({ status: 'AVAILABLE' }, { where: { id: orderAssignment.driver_id } });
      }
    }

    return success(res, { id: order.id, status: order.status });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  listOrderOnMarketplace,
  unlistOrder,
  assignOrder,
  getOrderBids,
  updateOrderStatus,
};
