/**
 * Dashboard Controller
 *
 * Aggregation endpoints for dashboard stats.
 * Returns count-based summaries to avoid N+1 queries on the frontend.
 */

const { Order, Driver, Bid, Assignment, User } = require('../models');
const { success } = require('../utils/response');
const { ORDER_STATUS, BID_STATUS } = require('../utils/constants');
const { Op } = require('sequelize');

/**
 * GET /api/dashboard/stats
 * Returns aggregated order counts by status for the company.
 */
const getStats = async (req, res, next) => {
  try {
    const companyId = req.tenantId;

    const [total, unassigned, listed, assigned, delivered, cancelled] = await Promise.all([
      Order.count({ where: { company_id: companyId } }),
      Order.count({ where: { company_id: companyId, status: ORDER_STATUS.UNASSIGNED } }),
      Order.count({ where: { company_id: companyId, status: ORDER_STATUS.LISTED } }),
      Order.count({ where: { company_id: companyId, status: ORDER_STATUS.ASSIGNED } }),
      Order.count({ where: { company_id: companyId, status: ORDER_STATUS.DELIVERED } }),
      Order.count({ where: { company_id: companyId, status: ORDER_STATUS.CANCELLED } }),
    ]);

    const inProgress = await Order.count({
      where: {
        company_id: companyId,
        status: { [Op.in]: [ORDER_STATUS.PICKED_UP, ORDER_STATUS.EN_ROUTE] },
      },
    });

    const activeBids = await Bid.count({
      where: { status: BID_STATUS.PENDING },
      include: [{ model: Order, as: 'order', where: { company_id: companyId }, attributes: [] }],
    });

    return success(res, {
      totalOrders: total,
      unassigned,
      listed,
      assigned,
      inProgress,
      delivered,
      cancelled,
      activeBids,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/user
 * Returns the current user's profile info.
 * CE-02: Will use JWT-extracted user ID.
 */
const getUser = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'], 10) : null;

    if (!userId) {
      return success(res, {
        name: 'Guest',
        email: '',
        location: '',
        initials: 'G',
        newDeliveries: 0,
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return success(res, {
        name: 'Unknown',
        email: '',
        location: '',
        initials: '?',
        newDeliveries: 0,
      });
    }

    // Count recent unassigned orders as "new deliveries"
    const newDeliveries = req.tenantId
      ? await Order.count({ where: { company_id: req.tenantId, status: ORDER_STATUS.UNASSIGNED } })
      : 0;

    const nameParts = user.name.split(' ');
    const initials = nameParts
      .map((p) => p[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    return success(res, {
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: '', // CE-02: Add location to user model
      initials,
      newDeliveries,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/marketplace-listings
 * Cross-tenant: returns all LISTED orders (for independent drivers).
 * No tenant scoping — drivers can see listings from all companies.
 */
const getMarketplaceListings = async (req, res, next) => {
  try {
    const { sort = 'newest', page = 1, limit = 20 } = req.query;

    const orderClause = [];
    switch (sort) {
      case 'price':
        orderClause.push(['listed_price', 'DESC']);
        break;
      case 'weight':
        orderClause.push(['weight_kg', 'DESC']);
        break;
      case 'priority':
        // URGENT > HIGH > NORMAL > LOW
        orderClause.push(['priority', 'ASC']);
        break;
      default:
        orderClause.push(['created_at', 'DESC']);
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { rows, count } = await Order.findAndCountAll({
      where: { status: ORDER_STATUS.LISTED },
      order: orderClause,
      limit: parseInt(limit, 10),
      offset,
      include: [{ model: require('../models').Bid, as: 'bids', attributes: ['id'] }],
    });

    // Transform to include bids count
    const listings = rows.map((order) => ({
      id: order.id,
      trackingCode: order.tracking_code,
      pickupAddress: order.pickup_address,
      deliveryAddress: order.delivery_address,
      listedPrice: parseFloat(order.listed_price),
      weight: parseFloat(order.weight_kg),
      priority: order.priority,
      postedAt: order.created_at,
      bidsCount: order.bids ? order.bids.length : 0,
      companyId: order.company_id,
    }));

    return success(res, listings, {
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(count / parseInt(limit, 10)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/driver-stats
 * Aggregated stats for a driver (earnings, deliveries count, etc.)
 */
const getDriverStats = async (req, res, next) => {
  try {
    const driverId = req.headers['x-driver-id'] ? parseInt(req.headers['x-driver-id'], 10) : null;

    if (!driverId) {
      return success(res, {
        activeDeliveries: 0,
        completedToday: 0,
        completedTotal: 0,
        pendingBids: 0,
        acceptedBidsToday: 0,
        rating: 0,
      });
    }

    const [activeDeliveries, completedTotal, pendingBids] = await Promise.all([
      Assignment.count({
        include: [
          {
            model: Order,
            as: 'order',
            where: {
              status: {
                [Op.in]: [ORDER_STATUS.ASSIGNED, ORDER_STATUS.PICKED_UP, ORDER_STATUS.EN_ROUTE],
              },
            },
            attributes: [],
          },
        ],
        where: { driver_id: driverId },
      }),
      Assignment.count({
        include: [
          {
            model: Order,
            as: 'order',
            where: { status: ORDER_STATUS.DELIVERED },
            attributes: [],
          },
        ],
        where: { driver_id: driverId },
      }),
      Bid.count({
        where: { driver_id: driverId, status: BID_STATUS.PENDING },
      }),
    ]);

    // Today's completed deliveries
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const completedToday = await Assignment.count({
      include: [
        {
          model: Order,
          as: 'order',
          where: { status: ORDER_STATUS.DELIVERED },
          attributes: [],
        },
      ],
      where: {
        driver_id: driverId,
        updated_at: { [Op.gte]: startOfDay },
      },
    });

    return success(res, {
      activeDeliveries,
      completedToday,
      completedTotal,
      pendingBids,
      rating: 4.8, // CE-03: Compute from reviews
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/driver-bids
 * Returns all bids placed by a driver, along with order details.
 * No tenant scoping — independent drivers don't belong to a company.
 */
const getDriverBids = async (req, res, next) => {
  try {
    const driverId = req.headers['x-driver-id'] ? parseInt(req.headers['x-driver-id'], 10) : null;

    if (!driverId) {
      return success(res, []);
    }

    const bids = await Bid.findAll({
      where: { driver_id: driverId },
      include: [
        {
          model: Order,
          as: 'order',
          attributes: [
            'id',
            'tracking_code',
            'pickup_address',
            'delivery_address',
            'listed_price',
            'weight_kg',
            'status',
            'priority',
            'company_id',
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return success(res, bids);
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats, getUser, getMarketplaceListings, getDriverStats, getDriverBids };
