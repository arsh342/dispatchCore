/**
 * Health Controller
 *
 * Provides a health check endpoint for monitoring and load balancer probes.
 * Tests database connectivity and reports system uptime.
 */

const { sequelize } = require('../models');
const { success } = require('../utils/response');

const checkHealth = async (req, res, next) => {
    try {
        await sequelize.authenticate();

        return success(res, {
            status: 'healthy',
            uptime: Math.floor(process.uptime()),
            database: 'connected',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return res.status(503).json({
            success: false,
            data: {
                status: 'unhealthy',
                database: 'disconnected',
                timestamp: new Date().toISOString(),
            },
        });
    }
};

module.exports = { checkHealth };
