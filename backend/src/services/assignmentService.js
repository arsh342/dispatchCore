/**
 * Assignment Service
 *
 * Handles direct order assignment to employed drivers.
 * Uses SERIALIZABLE transactions + SELECT FOR UPDATE (pessimistic locking)
 * to prevent race conditions when two dispatchers assign the same order.
 *
 * Flow: Dispatcher assigns → Lock order & driver → Create assignment →
 *       Log delivery event → Emit RTDB events
 */

const {
  sequelize,
  Sequelize,
  Order,
  Driver,
  Vehicle,
  Assignment,
  DeliveryEvent,
} = require('../models');
const {
  ORDER_STATUS,
  DRIVER_STATUS,
  ASSIGNMENT_SOURCE,
  EVENT_TYPE,
} = require('../utils/constants');
const { NotFoundError, ConflictError, LockTimeoutError } = require('../utils/errors');
const logger = require('../config/logger');

class AssignmentService {
  constructor(realtime) {
    this.realtime = realtime; // RealtimeService instance (injected)
  }

  /**
   * Assign an order directly to an employed driver.
   * Uses SERIALIZABLE isolation + pessimistic locking to prevent double-assignment.
   *
   * @param {number} orderId - Order to assign
   * @param {number} driverId - Target driver
   * @param {number|null} vehicleId - Optional vehicle
   * @param {number} companyId - Company making the assignment
   * @param {Object} [options] - Additional options
   * @param {boolean} [options.allowBusy=false] - Allow assigning to a BUSY driver (e.g. route-match multi-drop)
   * @returns {Promise<Assignment>} The created assignment
   */
  async assignOrder(orderId, driverId, vehicleId, companyId, options = {}) {
    const transaction = await sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });

    try {
      // Lock the order row — prevents concurrent assignment
      const order = await Order.findByPk(orderId, {
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!order) {
        throw new NotFoundError('Order');
      }

      if (order.status !== ORDER_STATUS.UNASSIGNED) {
        throw new ConflictError(`Order cannot be assigned — current status is "${order.status}"`);
      }

      // Lock the driver row — prevents assigning a busy driver
      const driver = await Driver.findByPk(driverId, {
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!driver) {
        throw new NotFoundError('Driver');
      }

      if (driver.status === DRIVER_STATUS.BUSY && !options.allowBusy) {
        throw new ConflictError(`Driver is not available — currently busy with another delivery`);
      }

      // Validate vehicle belongs to the same company (if provided)
      if (vehicleId) {
        const vehicle = await Vehicle.findByPk(vehicleId, { transaction });
        if (!vehicle) {
          throw new NotFoundError('Vehicle');
        }
        if (vehicle.company_id !== order.company_id) {
          throw new ConflictError('Vehicle does not belong to this company');
        }
      }

      // Update order status
      await order.update({ status: ORDER_STATUS.ASSIGNED }, { transaction });

      // Update driver status (only if not already busy)
      if (driver.status !== DRIVER_STATUS.BUSY) {
        await driver.update({ status: DRIVER_STATUS.BUSY }, { transaction });
      }

      // Auto-resolve vehicle: use the provided vehicleId, or look up the driver's vehicle
      let resolvedVehicleId = vehicleId || null;
      if (!resolvedVehicleId) {
        const driverVehicle = await Vehicle.findOne({
          where: { driver_id: driverId },
          attributes: ['id'],
          transaction,
        });
        if (driverVehicle) resolvedVehicleId = driverVehicle.id;
      }

      // Create assignment record
      const assignment = await Assignment.create(
        {
          order_id: orderId,
          driver_id: driverId,
          vehicle_id: resolvedVehicleId,
          assigned_by_company_id: companyId,
          source: ASSIGNMENT_SOURCE.DIRECT,
        },
        { transaction },
      );

      // Log the ASSIGNED delivery event
      await DeliveryEvent.create(
        {
          assignment_id: assignment.id,
          event_type: EVENT_TYPE.ASSIGNED,
          timestamp: new Date(),
          notes: `Directly assigned by company #${companyId}`,
        },
        { transaction },
      );

      await transaction.commit();

      logger.info(
        {
          orderId,
          driverId,
          assignmentId: assignment.id,
          source: ASSIGNMENT_SOURCE.DIRECT,
        },
        'Order assigned successfully',
      );

      // Emit real-time events via Firebase RTDB
      this._emitAssignmentEvents(assignment, order, driver);

      return assignment;
    } catch (error) {
      await transaction.rollback();

      // Handle lock timeout specifically
      if (error.name === 'SequelizeDatabaseError' && error.message.includes('Lock wait timeout')) {
        throw new LockTimeoutError();
      }

      throw error;
    }
  }

  /**
   * Cancel an existing assignment.
   * Reverts order to UNASSIGNED and driver to AVAILABLE.
   *
   * @param {number} assignmentId
   * @returns {Promise<void>}
   */
  async cancelAssignment(assignmentId) {
    const transaction = await sequelize.transaction();

    try {
      const assignment = await Assignment.findByPk(assignmentId, {
        include: [
          { model: Order, as: 'order' },
          { model: Driver, as: 'driver' },
        ],
        transaction,
      });

      if (!assignment) {
        throw new NotFoundError('Assignment');
      }

      // Revert statuses
      await assignment.order.update({ status: ORDER_STATUS.UNASSIGNED }, { transaction });
      await assignment.driver.update({ status: DRIVER_STATUS.AVAILABLE }, { transaction });

      // Log cancellation event
      await DeliveryEvent.create(
        {
          assignment_id: assignmentId,
          event_type: EVENT_TYPE.FAILED,
          timestamp: new Date(),
          notes: 'Assignment cancelled',
        },
        { transaction },
      );

      // Remove the assignment record
      await assignment.destroy({ transaction });

      await transaction.commit();

      logger.info({ assignmentId }, 'Assignment cancelled');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Emit RTDB events after a successful assignment.
   * @private
   */
  _emitAssignmentEvents(assignment, order, driver) {
    if (!this.realtime) {
      return;
    }

    // Notify dispatchers in the company
    this.realtime.emitToCompany(order.company_id, 'assignment:created', {
      assignmentId: assignment.id,
      orderId: order.id,
      driverId: driver.id,
    });

    // Notify the driver directly
    this.realtime.emitToDriver(driver.id, 'assignment:new', {
      assignment: {
        id: assignment.id,
        orderId: order.id,
        source: assignment.source,
      },
      order: {
        id: order.id,
        pickupAddress: order.pickup_address,
        deliveryAddress: order.delivery_address,
        priority: order.priority,
      },
    });
  }
}

module.exports = AssignmentService;
