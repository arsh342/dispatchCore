/**
 * GraphQL Resolvers
 *
 * Resolves all queries and mutations defined in the schema.
 * Uses DataLoaders for efficient batched database access.
 * Delegates business logic to service classes.
 */

const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { Order, Driver, Bid, Assignment, Hub, User } = require('../../models');
const { ORDER_STATUS, DRIVER_STATUS, BID_STATUS } = require('../../utils/constants');

const resolvers = {
    // ── Query Resolvers ──

    Query: {
        dispatcherDashboard: async (_, { companyId }, { loaders }) => {
            const id = parseInt(companyId, 10);

            // Batch-load orders and drivers
            const [orders, drivers] = await Promise.all([
                loaders.ordersByCompanyLoader.load(id),
                loaders.driversByCompanyLoader.load(id),
            ]);

            const statusCounts = {
                unassigned: 0,
                listed: 0,
                assigned: 0,
                pickedUp: 0,
                enRoute: 0,
                delivered: 0,
                cancelled: 0,
            };

            const statusMap = {
                UNASSIGNED: 'unassigned',
                LISTED: 'listed',
                ASSIGNED: 'assigned',
                PICKED_UP: 'pickedUp',
                EN_ROUTE: 'enRoute',
                DELIVERED: 'delivered',
                CANCELLED: 'cancelled',
            };

            for (const order of orders) {
                const key = statusMap[order.status];
                if (key) {
                    statusCounts[key]++;
                }
            }

            const activeDrivers = drivers.filter(
                (d) => d.status === DRIVER_STATUS.AVAILABLE || d.status === DRIVER_STATUS.BUSY,
            );

            const recentAssignments = await Assignment.findAll({
                include: [
                    {
                        model: Order,
                        as: 'order',
                        where: { company_id: id },
                    },
                ],
                order: [['created_at', 'DESC']],
                limit: 10,
            });

            const pendingBids = await Bid.findAll({
                where: { status: BID_STATUS.PENDING },
                include: [
                    {
                        model: Order,
                        as: 'order',
                        where: { company_id: id },
                    },
                ],
                order: [['created_at', 'DESC']],
            });

            return {
                ordersByStatus: statusCounts,
                activeDrivers,
                recentAssignments,
                pendingBids,
            };
        },

        orders: async (_, { companyId, status, page = 1, limit = 20 }) => {
            const where = { company_id: parseInt(companyId, 10) };
            if (status) {
                where.status = status;
            }

            const offset = (page - 1) * limit;
            const { rows, count } = await Order.findAndCountAll({
                where,
                order: [['created_at', 'DESC']],
                limit,
                offset,
            });

            return {
                records: rows,
                total: count,
                page,
                totalPages: Math.ceil(count / limit),
            };
        },

        order: async (_, { id }) => {
            return Order.findByPk(parseInt(id, 10));
        },

        listedOrders: async (_, { companyId }) => {
            return Order.findAll({
                where: {
                    company_id: parseInt(companyId, 10),
                    status: ORDER_STATUS.LISTED,
                },
                order: [['created_at', 'DESC']],
            });
        },

        drivers: async (_, { companyId, status, type }) => {
            const where = { company_id: parseInt(companyId, 10) };
            if (status) {
                where.status = status;
            }
            if (type) {
                where.type = type;
            }

            return Driver.findAll({
                where,
                include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
            });
        },

        driver: async (_, { id }) => {
            return Driver.findByPk(parseInt(id, 10), {
                include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
            });
        },

        deliveryHistory: async (_, { companyId, page = 1, limit = 20 }) => {
            const offset = (page - 1) * limit;

            const { rows, count } = await Assignment.findAndCountAll({
                include: [
                    {
                        model: Order,
                        as: 'order',
                        where: { company_id: parseInt(companyId, 10) },
                    },
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset,
                distinct: true,
            });

            return {
                records: rows,
                total: count,
                page,
                totalPages: Math.ceil(count / limit),
            };
        },

        deliveryDetail: async (_, { assignmentId }) => {
            return Assignment.findByPk(parseInt(assignmentId, 10));
        },

        hubs: async (_, { companyId }, { loaders }) => {
            return loaders.hubsByCompanyLoader.load(parseInt(companyId, 10));
        },

        analytics: async (_, { companyId }) => {
            const id = parseInt(companyId, 10);

            const [totalOrders, deliveredOrders, cancelledOrders, activeDrivers, totalBids] =
                await Promise.all([
                    Order.count({ where: { company_id: id } }),
                    Order.count({ where: { company_id: id, status: ORDER_STATUS.DELIVERED } }),
                    Order.count({ where: { company_id: id, status: ORDER_STATUS.CANCELLED } }),
                    Driver.count({
                        where: {
                            company_id: id,
                            status: { [Op.in]: [DRIVER_STATUS.AVAILABLE, DRIVER_STATUS.BUSY] },
                        },
                    }),
                    Bid.count({
                        include: [{ model: Order, as: 'order', where: { company_id: id }, attributes: [] }],
                    }),
                ]);

            return {
                totalOrders,
                deliveredOrders,
                cancelledOrders,
                averageDeliveryTime: null, // CE-02: compute from delivery events
                activeDrivers,
                totalBids,
            };
        },
    },

    // ── Mutation Resolvers ──

    Mutation: {
        createOrder: async (_, args) => {
            return Order.create({
                company_id: parseInt(args.companyId, 10),
                tracking_code: uuidv4(),
                status: ORDER_STATUS.UNASSIGNED,
                pickup_lat: args.pickupLat,
                pickup_lng: args.pickupLng,
                pickup_address: args.pickupAddress,
                delivery_lat: args.deliveryLat,
                delivery_lng: args.deliveryLng,
                delivery_address: args.deliveryAddress,
                priority: args.priority || 'NORMAL',
                weight_kg: args.weightKg,
                notes: args.notes,
            });
        },

        listOrder: async (_, { orderId, price }, { services }) => {
            return services.marketplace.listOrder(parseInt(orderId, 10), price);
        },

        unlistOrder: async (_, { orderId }, { services }) => {
            return services.marketplace.unlistOrder(parseInt(orderId, 10));
        },

        assignOrder: async (_, { orderId, driverId, vehicleId }, { services }) => {
            return services.assignment.assignOrder(
                parseInt(orderId, 10),
                parseInt(driverId, 10),
                vehicleId ? parseInt(vehicleId, 10) : null,
                null, // CE-02: dispatcher from JWT context
            );
        },

        placeBid: async (_, { orderId, driverId, offeredPrice, message }, { services }) => {
            return services.marketplace.placeBid(
                parseInt(orderId, 10),
                parseInt(driverId, 10),
                offeredPrice,
                message,
            );
        },

        acceptBid: async (_, { bidId }, { services }) => {
            return services.marketplace.acceptBid(parseInt(bidId, 10));
        },

        rejectBid: async (_, { bidId }, { services }) => {
            return services.marketplace.rejectBid(parseInt(bidId, 10));
        },
    },

    // ── Type Resolvers (use DataLoader for N+1 prevention) ──

    Order: {
        customer: (order, _, { loaders }) => {
            return order.customer_id ? loaders.userLoader.load(order.customer_id) : null;
        },
        assignment: (order, _, { loaders }) => {
            return loaders.assignmentByOrderLoader.load(order.id);
        },
        bids: (order, _, { loaders }) => {
            return loaders.bidsByOrderLoader.load(order.id);
        },
        trackingCode: (order) => order.tracking_code,
        listedPrice: (order) => order.listed_price,
        weightKg: (order) => order.weight_kg,
        pickupAddress: (order) => order.pickup_address,
        deliveryAddress: (order) => order.delivery_address,
        pickupLat: (order) => order.pickup_lat,
        pickupLng: (order) => order.pickup_lng,
        deliveryLat: (order) => order.delivery_lat,
        deliveryLng: (order) => order.delivery_lng,
        createdAt: (order) => order.created_at?.toISOString(),
    },

    Driver: {
        user: (driver, _, { loaders }) => {
            return driver.user || loaders.userLoader.load(driver.user_id);
        },
        vehicle: (driver, _, { loaders }) => {
            return loaders.vehicleByDriverLoader.load(driver.id);
        },
        companyId: (driver) => driver.company_id,
        verificationStatus: (driver) => driver.verification_status,
        licenseNumber: (driver) => driver.license_number,
    },

    Assignment: {
        driver: (assignment, _, { loaders }) => {
            return loaders.driverLoader.load(assignment.driver_id);
        },
        vehicle: (assignment, _, { loaders }) => {
            return assignment.vehicle_id ? loaders.vehicleLoader.load(assignment.vehicle_id) : null;
        },
        events: (assignment, _, { loaders }) => {
            return loaders.eventsByAssignmentLoader.load(assignment.id);
        },
        orderId: (a) => a.order_id,
        driverId: (a) => a.driver_id,
        vehicleId: (a) => a.vehicle_id,
        estimatedArrival: (a) => a.estimated_arrival?.toISOString(),
        createdAt: (a) => a.created_at?.toISOString(),
    },

    Bid: {
        driver: (bid, _, { loaders }) => {
            return loaders.driverLoader.load(bid.driver_id);
        },
        orderId: (bid) => bid.order_id,
        driverId: (bid) => bid.driver_id,
        offeredPrice: (bid) => bid.offered_price,
        createdAt: (bid) => bid.created_at?.toISOString(),
    },

    Vehicle: {
        plateNumber: (v) => v.plate_number,
        capacityKg: (v) => v.capacity_kg,
    },

    DeliveryEvent: {
        eventType: (e) => e.event_type,
        timestamp: (e) => e.timestamp?.toISOString(),
        photoUrl: (e) => e.photo_url,
    },
};

module.exports = resolvers;
