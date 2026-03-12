/**
 * Route Aggregator
 *
 * Mounts all route modules under their respective API prefixes.
 * This is the single point where all routes are registered.
 */

const router = require('express').Router();

const healthRoutes = require('./healthRoutes');
const companyRoutes = require('./companyRoutes');
const orderRoutes = require('./orderRoutes');
const bidRoutes = require('./bidRoutes');
const driverRoutes = require('./driverRoutes');
const locationRoutes = require('./locationRoutes');
const historyRoutes = require('./historyRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const authRoutes = require('./authRoutes');
const superadminRoutes = require('./superadminRoutes');
const messageRoutes = require('./messageRoutes');

router.use('/health', healthRoutes);
router.use('/companies', companyRoutes);
router.use('/orders', orderRoutes);
router.use('/bids', bidRoutes);
router.use('/drivers', driverRoutes);
router.use('/location', locationRoutes);
router.use('/history', historyRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/auth', authRoutes);
router.use('/superadmin', superadminRoutes);
router.use('/messages', messageRoutes);

module.exports = router;
