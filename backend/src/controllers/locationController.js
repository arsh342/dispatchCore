/**
 * Location Controller
 *
 * Handles GPS ping submissions and public order tracking lookups.
 */

const {
  Order,
  Assignment,
  Driver,
  DriverLocationLog,
  DeliveryEvent,
  Company,
  User,
} = require('../models');
const { success } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');
const { ORDER_STATUS } = require('../utils/constants');

const pingLocation = async (req, res, next) => {
  try {
    const { lat, lng, speed, heading } = req.body;
    const locationService = req.app.get('locationService');

    // CE-02: Replace with driver ID from JWT
    const driverId = parseInt(req.headers['x-driver-id'], 10);

    if (!driverId || isNaN(driverId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid x-driver-id header is required',
          status: 400,
        },
      });
    }

    // Validate driver exists before inserting location log
    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Driver with id ${driverId} not found`, status: 404 },
      });
    }

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
        'id',
        'tracking_code',
        'status',
        'pickup_address',
        'delivery_address',
        'pickup_lat',
        'pickup_lng',
        'delivery_lat',
        'delivery_lng',
        'priority',
        'weight_kg',
        'recipient_name',
        'recipient_phone',
        'recipient_email',
        'notes',
        'created_at',
      ],
      include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'address'] }],
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
        pickupLat: order.pickup_lat,
        pickupLng: order.pickup_lng,
        deliveryLat: order.delivery_lat,
        deliveryLng: order.delivery_lng,
        priority: order.priority,
        weightKg: order.weight_kg,
        notes: order.notes,
        recipientName: order.recipient_name,
        recipientPhone: order.recipient_phone,
        recipientEmail: order.recipient_email,
        createdAt: order.created_at,
      },
      company: order.company
        ? { id: order.company.id, name: order.company.name, address: order.company.address }
        : null,
      driver: null,
      lastLocation: null,
      events: [],
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
            attributes: ['id', 'type', 'status'],
            include: [{ model: User, as: 'user', attributes: ['name', 'phone'] }],
          },
        ],
      });

      if (assignment && assignment.driver) {
        response.driver = {
          id: assignment.driver.id,
          name: assignment.driver.user?.name ?? `Driver #${assignment.driver.id}`,
          phone: assignment.driver.user?.phone ?? null,
          type: assignment.driver.type,
          status: assignment.driver.status,
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

        // Get delivery events (audit trail)
        const events = await DeliveryEvent.findAll({
          where: { assignment_id: assignment.id },
          order: [['timestamp', 'ASC']],
          attributes: ['event_type', 'timestamp', 'notes'],
        });
        response.events = events.map((e) => ({
          type: e.event_type,
          timestamp: e.timestamp,
          notes: e.notes,
        }));
      }
    }

    // Also fetch events for delivered/non-active orders
    if (!['ASSIGNED', 'PICKED_UP', 'EN_ROUTE'].includes(order.status)) {
      const assignment = await Assignment.findOne({ where: { order_id: order.id } });
      if (assignment) {
        const events = await DeliveryEvent.findAll({
          where: { assignment_id: assignment.id },
          order: [['timestamp', 'ASC']],
          attributes: ['event_type', 'timestamp', 'notes'],
        });
        response.events = events.map((e) => ({
          type: e.event_type,
          timestamp: e.timestamp,
          notes: e.notes,
        }));
      }
    }

    return success(res, response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/location/drivers — Get latest location for all company drivers
 */
const getDriverLocations = async (req, res, next) => {
  try {
    const companyId = req.headers['x-company-id'];

    // Get all drivers for this company
    const drivers = await Driver.findAll({
      where: companyId ? { company_id: parseInt(companyId, 10) } : {},
      attributes: ['id', 'status'],
      include: [{ model: require('../models').User, as: 'user', attributes: ['name'] }],
    });

    const locations = [];
    for (const driver of drivers) {
      const latest = await DriverLocationLog.findOne({
        where: { driver_id: driver.id },
        order: [['recorded_at', 'DESC']],
        attributes: ['lat', 'lng', 'speed', 'heading', 'recorded_at'],
      });
      if (latest) {
        locations.push({
          driverId: driver.id,
          name: driver.user?.name ?? `Driver #${driver.id}`,
          status: driver.status,
          lat: parseFloat(latest.lat),
          lng: parseFloat(latest.lng),
          speed: latest.speed ? parseFloat(latest.speed) : null,
          heading: latest.heading ? parseFloat(latest.heading) : null,
          recordedAt: latest.recorded_at,
        });
      }
    }

    return success(res, locations);
  } catch (error) {
    next(error);
  }
};

module.exports = { pingLocation, trackOrder, getDriverLocations };
