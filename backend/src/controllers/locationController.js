/**
 * Location Controller
 *
 * Handles GPS ping submissions and public order tracking lookups.
 */

const { Order, Assignment, Driver, DriverLocationLog } = require('../models');
const { success } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');
const { ORDER_STATUS } = require('../utils/constants');

const pingLocation = async (req, res, next) => {
    try {
        const { lat, lng, speed, heading } = req.body;
        const locationService = req.app.get('locationService');

        // CE-02: Replace with driver ID from JWT
        const driverId = parseInt(req.headers['x-driver-id'], 10);

        const locationLog = await locationService.recordPing(driverId, lat, lng, speed, heading);

        return success(res, { recorded: true, id: locationLog.id });
    } catch (error) {
        next(error);
    }
};

const trackOrder = async (req, res, next) => {
    try {
        const { trackingCode } = req.params;

        const order = await Order.findOne({
            where: { tracking_code: trackingCode },
            attributes: [
                'id', 'tracking_code', 'status',
                'pickup_address', 'delivery_address',
                'created_at',
            ],
        });

        if (!order) {
            throw new NotFoundError('Order');
        }

        const response = {
            order: {
                id: order.id,
                trackingCode: order.tracking_code,
                status: order.status,
                pickupAddress: order.pickup_address,
                deliveryAddress: order.delivery_address,
                createdAt: order.created_at,
            },
            driver: null,
            lastLocation: null,
        };

        // If order is actively being delivered, include driver location
        const activeStatuses = [ORDER_STATUS.ASSIGNED, ORDER_STATUS.PICKED_UP, ORDER_STATUS.EN_ROUTE];

        if (activeStatuses.includes(order.status)) {
            const assignment = await Assignment.findOne({
                where: { order_id: order.id },
                include: [
                    {
                        model: Driver,
                        as: 'driver',
                        attributes: ['id', 'type'],
                    },
                ],
            });

            if (assignment && assignment.driver) {
                response.driver = {
                    id: assignment.driver.id,
                    type: assignment.driver.type,
                };

                // Get latest location
                const latestLocation = await DriverLocationLog.findOne({
                    where: { driver_id: assignment.driver.id },
                    order: [['recorded_at', 'DESC']],
                    attributes: ['lat', 'lng', 'speed', 'heading', 'recorded_at'],
                });

                if (latestLocation) {
                    response.lastLocation = {
                        lat: latestLocation.lat,
                        lng: latestLocation.lng,
                        speed: latestLocation.speed,
                        heading: latestLocation.heading,
                        recordedAt: latestLocation.recorded_at,
                    };
                }

                if (assignment.estimated_arrival) {
                    response.estimatedArrival = assignment.estimated_arrival;
                }
            }
        }

        return success(res, response);
    } catch (error) {
        next(error);
    }
};

module.exports = { pingLocation, trackOrder };
