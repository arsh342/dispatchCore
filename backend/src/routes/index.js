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

router.use('/health', healthRoutes);
router.use('/companies', companyRoutes);
router.use('/orders', orderRoutes);
router.use('/bids', bidRoutes);
router.use('/drivers', driverRoutes);
router.use('/location', locationRoutes);
router.use('/history', historyRoutes);

module.exports = router;
