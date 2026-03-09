'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Seed Data
 *
 * Populates the database with realistic sample data for development.
 *
 * Setup:
 *   - 1 company: "Fast Delivery"
 *   - Dispatcher view = the company itself (no separate person)
 *   - 1 employed driver: "John Doe" (works for Fast Delivery)
 *   - 1 independent driver: "Bob" (freelancer, no company)
 *   - Sample orders in various statuses + assignments + a listed order for bidding
 *
 * Login credentials for testing:
 *   Dispatcher:        dispatcher@fastdelivery.com  (any password)
 *   Employed Driver:   john@fastdelivery.com        (any password)
 *   Independent Driver: bob@driver.com              (any password)
 *   SuperAdmin:         admin@dispatchcore.com       (any password)
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // ── Company ──
    await queryInterface.bulkInsert('companies', [
      {
        id: 1,
        name: 'Fast Delivery',
        address: 'Chandigarh, India',
        plan_type: 'PREMIUM',
        created_at: now,
        updated_at: now,
      },
    ]);

    // ── Users ──
    // The "dispatcher" user represents the company operator (no driver record).
    // Driver users have a matching row in the drivers table.
    await queryInterface.bulkInsert('users', [
      // Company operator / dispatcher
      {
        id: 1,
        company_id: 1,
        name: 'Fast Delivery',
        email: 'dispatcher@fastdelivery.com',
        phone: '+919000000001',
        role: 'admin',
        created_at: now,
        updated_at: now,
      },
      // Employed driver — John Doe (belongs to Fast Delivery)
      {
        id: 2,
        company_id: 1,
        name: 'John Doe',
        email: 'john@fastdelivery.com',
        phone: '+919000000002',
        role: 'customer',
        created_at: now,
        updated_at: now,
      },
      // Independent driver — Bob (no company)
      {
        id: 3,
        company_id: null,
        name: 'Bob',
        email: 'bob@driver.com',
        phone: '+919000000003',
        role: 'customer',
        created_at: now,
        updated_at: now,
      },
      // SuperAdmin — platform-level admin
      {
        id: 4,
        company_id: null,
        name: 'Platform Admin',
        email: 'admin@dispatchcore.com',
        phone: '+919000000004',
        role: 'superadmin',
        created_at: now,
        updated_at: now,
      },
    ]);

    // ── Drivers ──
    await queryInterface.bulkInsert('drivers', [
      // John Doe — employed by Fast Delivery
      {
        id: 1,
        user_id: 2,
        company_id: 1,
        type: 'EMPLOYED',
        status: 'AVAILABLE',
        verification_status: 'VERIFIED',
        license_number: 'CH01-DL-001',
        created_at: now,
        updated_at: now,
      },
      // Bob — independent freelancer
      {
        id: 2,
        user_id: 3,
        company_id: null,
        type: 'INDEPENDENT',
        status: 'AVAILABLE',
        verification_status: 'VERIFIED',
        license_number: 'CH01-DL-002',
        created_at: now,
        updated_at: now,
      },
    ]);

    // ── Vehicles ──
    await queryInterface.bulkInsert('vehicles', [
      {
        id: 1,
        company_id: 1,
        driver_id: 1,
        plate_number: 'CH01-AB-1234',
        type: 'VAN',
        capacity_kg: 500.0,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
    ]);

    // ── Hubs ──
    await queryInterface.bulkInsert('hubs', [
      {
        id: 1,
        company_id: 1,
        name: 'Fast Delivery HQ',
        address: 'Sector 17, Chandigarh',
        lat: 30.7333,
        lng: 76.7794,
        created_at: now,
        updated_at: now,
      },
    ]);

    // ── Orders ──
    await queryInterface.bulkInsert('orders', [
      // Order 1 — UNASSIGNED (dispatcher can assign to John or list on marketplace)
      {
        id: 1,
        company_id: 1,
        customer_id: null,
        tracking_code: uuidv4(),
        status: 'UNASSIGNED',
        weight_kg: 2.5,
        pickup_lat: 30.7333,
        pickup_lng: 76.7794,
        pickup_address: 'Chandigarh',
        delivery_lat: 30.5161,
        delivery_lng: 76.6598,
        delivery_address: 'Chitkara',
        priority: 'NORMAL',
        created_at: now,
        updated_at: now,
      },
      // Order 2 — LISTED on marketplace for independent drivers to bid ($15)
      {
        id: 2,
        company_id: 1,
        customer_id: null,
        tracking_code: uuidv4(),
        status: 'LISTED',
        listed_price: 15.0,
        weight_kg: 5.0,
        pickup_lat: 30.7333,
        pickup_lng: 76.7794,
        pickup_address: 'Chandigarh',
        delivery_lat: 30.3398,
        delivery_lng: 76.3869,
        delivery_address: 'Patiala',
        priority: 'URGENT',
        created_at: now,
        updated_at: now,
      },
      // Order 3 — ASSIGNED to John Doe (employed driver)
      {
        id: 3,
        company_id: 1,
        customer_id: null,
        tracking_code: uuidv4(),
        status: 'ASSIGNED',
        weight_kg: 1.0,
        pickup_lat: 30.7333,
        pickup_lng: 76.7794,
        pickup_address: 'Chandigarh',
        delivery_lat: 30.901,
        delivery_lng: 76.8573,
        delivery_address: 'Mohali',
        priority: 'HIGH',
        created_at: now,
        updated_at: now,
      },
      // Order 4 — EN_ROUTE by John Doe
      {
        id: 4,
        company_id: 1,
        customer_id: null,
        tracking_code: uuidv4(),
        status: 'EN_ROUTE',
        weight_kg: 3.0,
        pickup_lat: 30.7333,
        pickup_lng: 76.7794,
        pickup_address: 'Chandigarh',
        delivery_lat: 30.3782,
        delivery_lng: 76.7767,
        delivery_address: 'Ambala',
        priority: 'NORMAL',
        created_at: now,
        updated_at: now,
      },
      // Order 5 — DELIVERED (completed)
      {
        id: 5,
        company_id: 1,
        customer_id: null,
        tracking_code: uuidv4(),
        status: 'DELIVERED',
        weight_kg: 0.5,
        pickup_lat: 30.7333,
        pickup_lng: 76.7794,
        pickup_address: 'Chandigarh',
        delivery_lat: 30.901,
        delivery_lng: 76.8573,
        delivery_address: 'Mohali',
        priority: 'LOW',
        created_at: now,
        updated_at: now,
      },
    ]);

    // ── Assignments ──
    await queryInterface.bulkInsert('assignments', [
      // Order 3 → John Doe (ASSIGNED)
      {
        id: 1,
        order_id: 3,
        driver_id: 1,
        vehicle_id: 1,
        assigned_by: 1,
        source: 'DIRECT',
        created_at: now,
        updated_at: now,
      },
      // Order 4 → John Doe (EN_ROUTE)
      {
        id: 2,
        order_id: 4,
        driver_id: 1,
        vehicle_id: 1,
        assigned_by: 1,
        source: 'DIRECT',
        created_at: now,
        updated_at: now,
      },
      // Order 5 → John Doe (DELIVERED — completed)
      {
        id: 3,
        order_id: 5,
        driver_id: 1,
        vehicle_id: 1,
        assigned_by: 1,
        source: 'DIRECT',
        created_at: now,
        updated_at: now,
      },
    ]);

    // ── Delivery Events ──
    await queryInterface.bulkInsert('delivery_events', [
      {
        id: 1,
        assignment_id: 1,
        event_type: 'ASSIGNED',
        timestamp: now,
        notes: 'Assigned by dispatcher',
      },
      {
        id: 2,
        assignment_id: 2,
        event_type: 'ASSIGNED',
        timestamp: new Date(now.getTime() - 3600000),
        notes: 'Assigned by dispatcher',
      },
      {
        id: 3,
        assignment_id: 2,
        event_type: 'PICKED_UP',
        timestamp: new Date(now.getTime() - 1800000),
        notes: 'Picked up from Chandigarh',
      },
      {
        id: 4,
        assignment_id: 3,
        event_type: 'ASSIGNED',
        timestamp: new Date(now.getTime() - 86400000),
        notes: 'Assigned by dispatcher',
      },
      {
        id: 5,
        assignment_id: 3,
        event_type: 'DELIVERED',
        timestamp: new Date(now.getTime() - 82800000),
        notes: 'Delivered to Mohali',
      },
    ]);

    // ── Bid on order #2 (Bob bidding on listed order) ──
    await queryInterface.bulkInsert('bids', [
      {
        id: 1,
        order_id: 2,
        driver_id: 2,
        offered_price: 12.0,
        status: 'PENDING',
        message: 'I can pick this up within 30 minutes',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    // Reverse order to respect FK constraints
    await queryInterface.bulkDelete('driver_routes', null, {});
    await queryInterface.bulkDelete('bids', null, {});
    await queryInterface.bulkDelete('delivery_events', null, {});
    await queryInterface.bulkDelete('assignments', null, {});
    await queryInterface.bulkDelete('orders', null, {});
    await queryInterface.bulkDelete('hubs', null, {});
    await queryInterface.bulkDelete('vehicles', null, {});
    await queryInterface.bulkDelete('drivers', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('companies', null, {});
  },
};
