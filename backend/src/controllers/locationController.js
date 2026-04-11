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
} = require('../models');
const { success } = require('../utils/response');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const { ORDER_STATUS } = require('../utils/constants');

// With `underscored: true` in Sequelize config, timestamps are always snake_case.
const getCreatedAt = (record) => record?.created_at ?? null;

const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

const pingLocation = async (req, res, next) => {
  try {
    const { lat, lng, speed, heading } = req.body;
    const locationService = req.app.get('locationService');

    const driverId = req.identity?.driverId ?? null;

    if (!driverId) {
      throw new ForbiddenError('Driver identity is required');
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
        createdAt: getCreatedAt(order),
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
            attributes: ['id', 'name', 'phone', 'type', 'status'],
          },
        ],
      });

      if (assignment && assignment.driver) {
        response.driver = {
          id: assignment.driver.id,
          name: assignment.driver.name ?? `Driver #${assignment.driver.id}`,
          phone: assignment.driver.phone ?? null,
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
    const companyId = req.tenantId ?? req.identity?.companyId ?? null;

    if (!companyId) {
      throw new ForbiddenError('Company context is required to view driver locations');
    }

    // Single query: join drivers with their latest location log (avoids N+1)
    const locations = await sequelize.query(
      `SELECT d.id AS driverId, d.name, d.status,
              l.lat, l.lng, l.speed, l.heading, l.recorded_at AS recordedAt
       FROM drivers d
       INNER JOIN driver_location_logs l ON l.id = (
         SELECT id FROM driver_location_logs
         WHERE driver_id = d.id
         ORDER BY recorded_at DESC
         LIMIT 1
       )
       WHERE d.company_id = :companyId`,
      { replacements: { companyId }, type: QueryTypes.SELECT },
    );

    const formatted = locations.map((row) => ({
      driverId: row.driverId,
      name: row.name ?? `Driver #${row.driverId}`,
      status: row.status,
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
      speed: row.speed ? parseFloat(row.speed) : null,
      heading: row.heading ? parseFloat(row.heading) : null,
      recordedAt: row.recordedAt,
    }));

    return success(res, formatted);
  } catch (error) {
    next(error);
  }
};

module.exports = { pingLocation, trackOrder, getDriverLocations };
