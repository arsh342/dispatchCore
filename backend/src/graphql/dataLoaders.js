/**
 * DataLoaders
 *
 * Prevents N+1 queries in GraphQL resolvers by batching
 * and caching database reads. Each request gets a fresh
 * set of DataLoaders (per-request caching via context).
 */

const DataLoader = require('dataloader');
const { Company, User, Driver, Vehicle, Order, Bid, Assignment, DeliveryEvent, Hub } = require('../models');

/**
 * Create a fresh set of DataLoaders.
 * Called once per GraphQL request in the Apollo context function.
 */
const createLoaders = () => ({
    // ── By Primary Key ──

    companyLoader: new DataLoader(async (ids) => {
        const companies = await Company.findAll({ where: { id: ids } });
        const map = new Map(companies.map((c) => [c.id, c]));
        return ids.map((id) => map.get(id) || null);
    }),

    userLoader: new DataLoader(async (ids) => {
        const users = await User.findAll({ where: { id: ids } });
        const map = new Map(users.map((u) => [u.id, u]));
        return ids.map((id) => map.get(id) || null);
    }),

    driverLoader: new DataLoader(async (ids) => {
        const drivers = await Driver.findAll({
            where: { id: ids },
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
        });
        const map = new Map(drivers.map((d) => [d.id, d]));
        return ids.map((id) => map.get(id) || null);
    }),

    vehicleLoader: new DataLoader(async (ids) => {
        const vehicles = await Vehicle.findAll({ where: { id: ids } });
        const map = new Map(vehicles.map((v) => [v.id, v]));
        return ids.map((id) => map.get(id) || null);
    }),

    orderLoader: new DataLoader(async (ids) => {
        const orders = await Order.findAll({ where: { id: ids } });
        const map = new Map(orders.map((o) => [o.id, o]));
        return ids.map((id) => map.get(id) || null);
    }),

    // ── By Foreign Key (one-to-many) ──

    ordersByCompanyLoader: new DataLoader(async (companyIds) => {
        const orders = await Order.findAll({ where: { company_id: companyIds } });
        return companyIds.map((id) => orders.filter((o) => o.company_id === id));
    }),

    driversByCompanyLoader: new DataLoader(async (companyIds) => {
        const drivers = await Driver.findAll({
            where: { company_id: companyIds },
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
        });
        return companyIds.map((id) => drivers.filter((d) => d.company_id === id));
    }),

    bidsByOrderLoader: new DataLoader(async (orderIds) => {
        const bids = await Bid.findAll({
            where: { order_id: orderIds },
            order: [['created_at', 'DESC']],
        });
        return orderIds.map((id) => bids.filter((b) => b.order_id === id));
    }),

    assignmentByOrderLoader: new DataLoader(async (orderIds) => {
        const assignments = await Assignment.findAll({
            where: { order_id: orderIds },
        });
        const map = new Map(assignments.map((a) => [a.order_id, a]));
        return orderIds.map((id) => map.get(id) || null);
    }),

    eventsByAssignmentLoader: new DataLoader(async (assignmentIds) => {
        const events = await DeliveryEvent.findAll({
            where: { assignment_id: assignmentIds },
            order: [['timestamp', 'ASC']],
        });
        return assignmentIds.map((id) =>
            events.filter((e) => e.assignment_id === id),
        );
    }),

    hubsByCompanyLoader: new DataLoader(async (companyIds) => {
        const hubs = await Hub.findAll({ where: { company_id: companyIds } });
        return companyIds.map((id) => hubs.filter((h) => h.company_id === id));
    }),

    vehicleByDriverLoader: new DataLoader(async (driverIds) => {
        const vehicles = await Vehicle.findAll({ where: { driver_id: driverIds } });
        const map = new Map(vehicles.map((v) => [v.driver_id, v]));
        return driverIds.map((id) => map.get(id) || null);
    }),
});

module.exports = { createLoaders };
