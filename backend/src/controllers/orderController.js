/**
 * Order Controller
 *
 * Handles order CRUD, marketplace listing, and direct assignment.
 * All queries are tenant-scoped via req.tenantId.
 */

const { v4: uuidv4 } = require('uuid');
const { Order, Bid } = require('../models');
const { success } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');
const { ORDER_STATUS } = require('../utils/constants');

const createOrder = async (req, res, next) => {
    try {
        const {
            pickup_lat, pickup_lng, pickup_address,
            delivery_lat, delivery_lng, delivery_address,
            priority, weight_kg, notes, customer_id,
        } = req.body;

        const order = await Order.create({
            company_id: req.tenantId,
            customer_id: customer_id || null,
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
            where.status = status;
        }
        if (priority) {
            where.priority = priority;
        }

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        const { rows, count } = await Order.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit: parseInt(limit, 10),
            offset,
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
        const { driver_id, vehicle_id } = req.body;
        const assignmentService = req.app.get('assignmentService');

        // CE-02: Replace with req.user.id from JWT
        const dispatcherId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'], 10) : null;

        const assignment = await assignmentService.assignOrder(
            parseInt(req.params.id, 10),
            driver_id,
            vehicle_id || null,
            dispatcherId,
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
            order: [['created_at', 'DESC']],
        });

        return success(res, bids);
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
};
