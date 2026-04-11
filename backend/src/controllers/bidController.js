/**
 * Bid Controller
 *
 * Handles bid placement, acceptance, and rejection.
 * Delegates to MarketplaceService for business logic.
 */

const { success } = require('../utils/response');
const { ForbiddenError } = require('../utils/errors');

const placeBid = async (req, res, next) => {
    try {
        const { offered_price, message } = req.body;
        const marketplaceService = req.app.get('marketplaceService');

        const driverId = req.identity?.driverId ?? null;
        if (!driverId) {
            throw new ForbiddenError('Driver identity is required to place a bid');
        }

        const bid = await marketplaceService.placeBid(
            parseInt(req.params.id, 10),
            driverId,
            offered_price,
            message,
        );

        return success(res, bid, null, 201);
    } catch (error) {
        next(error);
    }
};

const acceptBid = async (req, res, next) => {
    try {
        const marketplaceService = req.app.get('marketplaceService');
        const assignment = await marketplaceService.acceptBid(
            parseInt(req.params.id, 10),
            req.tenantId,
        );

        return success(res, assignment);
    } catch (error) {
        next(error);
    }
};

const rejectBid = async (req, res, next) => {
    try {
        const marketplaceService = req.app.get('marketplaceService');
        const bid = await marketplaceService.rejectBid(
            parseInt(req.params.id, 10),
            req.tenantId,
        );

        return success(res, bid);
    } catch (error) {
        next(error);
    }
};

module.exports = { placeBid, acceptBid, rejectBid };
