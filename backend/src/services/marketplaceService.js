/**
 * Marketplace Service
 *
 * Manages the gig-economy marketplace where dispatchers list orders
 * and independent drivers bid on them.
 *
 * Flow: List order → Drivers bid → Dispatcher accepts a bid →
 *       Remaining bids rejected → Bid converts to Assignment
 */

const { sequelize, Order, Bid, Driver, Assignment, DeliveryEvent } = require('../models');
const {
    ORDER_STATUS,
    BID_STATUS,
    DRIVER_STATUS,
    ASSIGNMENT_SOURCE,
    EVENT_TYPE,
} = require('../utils/constants');
const { NotFoundError, ConflictError } = require('../utils/errors');
const logger = require('../config/logger');

class MarketplaceService {
    constructor(io) {
        this.io = io;
    }

    /**
     * List an order on the public marketplace.
     * Sets status to LISTED and assigns a listed price.
     *
     * @param {number} orderId
     * @param {number} price - Listed delivery price
     * @returns {Promise<Order>}
     */
    async listOrder(orderId, price) {
        const order = await Order.findByPk(orderId);

        if (!order) {
            throw new NotFoundError('Order');
        }

        if (order.status !== ORDER_STATUS.UNASSIGNED) {
            throw new ConflictError(
                `Only UNASSIGNED orders can be listed — current status is "${order.status}"`,
            );
        }

        await order.update({
            status: ORDER_STATUS.LISTED,
            listed_price: price,
        });

        logger.info('Order listed on marketplace', { orderId, price });

        this._emitToMarketplace(order.company_id, 'order:listed', {
            orderId: order.id,
            price,
            pickupAddress: order.pickup_address,
            deliveryAddress: order.delivery_address,
            priority: order.priority,
            weightKg: order.weight_kg,
        });

        return order;
    }

    /**
     * Remove an order from the marketplace.
     * Reverts status to UNASSIGNED.
     *
     * @param {number} orderId
     * @returns {Promise<Order>}
     */
    async unlistOrder(orderId) {
        const order = await Order.findByPk(orderId);

        if (!order) {
            throw new NotFoundError('Order');
        }

        if (order.status !== ORDER_STATUS.LISTED) {
            throw new ConflictError('Only LISTED orders can be unlisted');
        }

        await order.update({
            status: ORDER_STATUS.UNASSIGNED,
            listed_price: null,
        });

        logger.info('Order unlisted from marketplace', { orderId });

        this._emitToMarketplace(order.company_id, 'order:unlisted', { orderId });

        return order;
    }

    /**
     * Place a bid on a listed order.
     * Only verified independent drivers can bid.
     *
     * @param {number} orderId
     * @param {number} driverId
     * @param {number} offeredPrice
     * @param {string|null} message
     * @returns {Promise<Bid>}
     */
    async placeBid(orderId, driverId, offeredPrice, message = null) {
        const order = await Order.findByPk(orderId);

        if (!order) {
            throw new NotFoundError('Order');
        }

        if (order.status !== ORDER_STATUS.LISTED) {
            throw new ConflictError('Can only bid on LISTED orders');
        }

        const driver = await Driver.findByPk(driverId);

        if (!driver) {
            throw new NotFoundError('Driver');
        }

        // Check if this driver already has a pending bid on this order
        const existingBid = await Bid.findOne({
            where: {
                order_id: orderId,
                driver_id: driverId,
                status: BID_STATUS.PENDING,
            },
        });

        if (existingBid) {
            throw new ConflictError('You already have a pending bid on this order');
        }

        const bid = await Bid.create({
            order_id: orderId,
            driver_id: driverId,
            offered_price: offeredPrice,
            status: BID_STATUS.PENDING,
            message,
        });

        logger.info('New bid placed', { bidId: bid.id, orderId, driverId, offeredPrice });

        // Notify dispatchers of the company about the new bid
        this._emitToMarketplace(order.company_id, 'bid:new', {
            bidId: bid.id,
            orderId,
            driverId,
            offeredPrice,
            message,
        });

        return bid;
    }

    /**
     * Accept a bid — converts it into an assignment.
     * Rejects all other pending bids on the same order.
     * Uses a transaction to ensure atomicity.
     *
     * @param {number} bidId
     * @returns {Promise<Assignment>}
     */
    async acceptBid(bidId) {
        const transaction = await sequelize.transaction();

        try {
            const bid = await Bid.findByPk(bidId, {
                include: [
                    { model: Order, as: 'order' },
                    { model: Driver, as: 'driver' },
                ],
                transaction,
            });

            if (!bid) {
                throw new NotFoundError('Bid');
            }

            if (bid.status !== BID_STATUS.PENDING) {
                throw new ConflictError(`Bid is already "${bid.status}"`);
            }

            if (bid.order.status !== ORDER_STATUS.LISTED) {
                throw new ConflictError('Order is no longer available on marketplace');
            }

            // Accept this bid
            await bid.update({ status: BID_STATUS.ACCEPTED }, { transaction });

            // Reject all other pending bids on this order
            await this._rejectRemainingBids(bid.order_id, bidId, transaction);

            // Update order status
            await bid.order.update({ status: ORDER_STATUS.ASSIGNED }, { transaction });

            // Update driver status
            await bid.driver.update({ status: DRIVER_STATUS.BUSY }, { transaction });

            // Create assignment from the accepted bid
            const assignment = await Assignment.create(
                {
                    order_id: bid.order_id,
                    driver_id: bid.driver_id,
                    vehicle_id: null, // Independent drivers use their own vehicle
                    assigned_by: null, // System-assigned via bid acceptance
                    source: ASSIGNMENT_SOURCE.BID,
                },
                { transaction },
            );

            // Log delivery event
            await DeliveryEvent.create(
                {
                    assignment_id: assignment.id,
                    event_type: EVENT_TYPE.ASSIGNED,
                    timestamp: new Date(),
                    notes: `Assigned via accepted bid #${bidId} at price ${bid.offered_price}`,
                },
                { transaction },
            );

            await transaction.commit();

            logger.info('Bid accepted and assignment created', {
                bidId,
                orderId: bid.order_id,
                driverId: bid.driver_id,
                assignmentId: assignment.id,
            });

            // Emit events
            this._emitBidResult(bid, assignment);

            return assignment;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Reject a single bid.
     *
     * @param {number} bidId
     * @returns {Promise<Bid>}
     */
    async rejectBid(bidId) {
        const bid = await Bid.findByPk(bidId, {
            include: [{ model: Order, as: 'order' }],
        });

        if (!bid) {
            throw new NotFoundError('Bid');
        }

        if (bid.status !== BID_STATUS.PENDING) {
            throw new ConflictError(`Bid is already "${bid.status}"`);
        }

        await bid.update({ status: BID_STATUS.REJECTED });

        logger.info('Bid rejected', { bidId });

        if (this.io) {
            this.io.to(`driver:${bid.driver_id}`).emit('bid:rejected', {
                bidId,
                orderId: bid.order_id,
            });
        }

        return bid;
    }

    /**
     * Reject all other pending bids on an order (after one is accepted).
     * @private
     */
    async _rejectRemainingBids(orderId, acceptedBidId, transaction) {
        const pendingBids = await Bid.findAll({
            where: {
                order_id: orderId,
                status: BID_STATUS.PENDING,
            },
            transaction,
        });

        for (const bid of pendingBids) {
            if (bid.id !== acceptedBidId) {
                await bid.update({ status: BID_STATUS.REJECTED }, { transaction });

                // Notify rejected drivers
                if (this.io) {
                    this.io.to(`driver:${bid.driver_id}`).emit('bid:rejected', {
                        bidId: bid.id,
                        orderId,
                    });
                }
            }
        }
    }

    /**
     * Emit WebSocket events after a bid is accepted.
     * @private
     */
    _emitBidResult(bid, assignment) {
        if (!this.io) {
            return;
        }

        // Notify the winning driver
        this.io.to(`driver:${bid.driver_id}`).emit('bid:accepted', {
            bidId: bid.id,
            orderId: bid.order_id,
            assignment: {
                id: assignment.id,
                source: ASSIGNMENT_SOURCE.BID,
            },
        });

        // Notify dispatchers
        this.io.to(`company:${bid.order.company_id}:dispatchers`).emit('assignment:created', {
            assignmentId: assignment.id,
            orderId: bid.order_id,
            driverId: bid.driver_id,
            source: ASSIGNMENT_SOURCE.BID,
        });
    }

    /**
     * Emit to the marketplace room for a given company.
     * @private
     */
    _emitToMarketplace(companyId, event, data) {
        if (!this.io) {
            return;
        }
        this.io.to(`company:${companyId}:marketplace`).emit(event, data);
    }
}

module.exports = MarketplaceService;
