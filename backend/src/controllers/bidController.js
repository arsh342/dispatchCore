/**
 * Bid Controller
 *
 * Handles bid placement, acceptance, and rejection.
 * Delegates to MarketplaceService for business logic.
 */

const { success } = require('../utils/response');

const placeBid = async (req, res, next) => {
    try {
        const { offered_price, message } = req.body;
        const marketplaceService = req.app.get('marketplaceService');

        // CE-02: Replace with driver ID from JWT auth
        const driverId = parseInt(req.headers['x-driver-id'], 10);

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
        const assignment = await marketplaceService.acceptBid(parseInt(req.params.id, 10));

        return success(res, assignment);
    } catch (error) {
        next(error);
    }
};

const rejectBid = async (req, res, next) => {
    try {
        const marketplaceService = req.app.get('marketplaceService');
        const bid = await marketplaceService.rejectBid(parseInt(req.params.id, 10));

        return success(res, bid);
    } catch (error) {
        next(error);
    }
};

module.exports = { placeBid, acceptBid, rejectBid };
