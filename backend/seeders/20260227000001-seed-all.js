'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Seed Data
 *
 * Populates the database with realistic sample data for development:
 * - 2 companies (SwiftCourier, UrbanFleet)
 * - 1 superadmin + 2 admins + 2 dispatchers + 3 customers
 * - 4 employed drivers + 2 independent drivers
 * - 4 vehicles
 * - 2 hubs per company
 * - 6 sample orders in various statuses
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const now = new Date();

        // ── Companies ──
        await queryInterface.bulkInsert('companies', [
            { id: 1, name: 'SwiftCourier', address: '123 Main St, Mumbai', plan_type: 'PREMIUM', created_at: now, updated_at: now },
            { id: 2, name: 'UrbanFleet', address: '456 Park Ave, Delhi', plan_type: 'BASIC', created_at: now, updated_at: now },
        ]);

        // ── Users ──
        await queryInterface.bulkInsert('users', [
            // SuperAdmin
            { id: 1, company_id: null, name: 'Platform Admin', email: 'admin@dispatchcore.io', phone: '9000000001', role: 'superadmin', created_at: now, updated_at: now },
            // Company 1 - SwiftCourier
            { id: 2, company_id: 1, name: 'Rahul Sharma', email: 'rahul@swiftcourier.com', phone: '9000000002', role: 'admin', created_at: now, updated_at: now },
            { id: 3, company_id: 1, name: 'Priya Patel', email: 'priya@swiftcourier.com', phone: '9000000003', role: 'dispatcher', created_at: now, updated_at: now },
            { id: 4, company_id: 1, name: 'Customer Aarav', email: 'aarav@gmail.com', phone: '9000000004', role: 'customer', created_at: now, updated_at: now },
            { id: 5, company_id: 1, name: 'Customer Diya', email: 'diya@gmail.com', phone: '9000000005', role: 'customer', created_at: now, updated_at: now },
            // Company 2 - UrbanFleet
            { id: 6, company_id: 2, name: 'Amit Singh', email: 'amit@urbanfleet.com', phone: '9000000006', role: 'admin', created_at: now, updated_at: now },
            { id: 7, company_id: 2, name: 'Neha Gupta', email: 'neha@urbanfleet.com', phone: '9000000007', role: 'dispatcher', created_at: now, updated_at: now },
            { id: 8, company_id: 2, name: 'Customer Ravi', email: 'ravi@gmail.com', phone: '9000000008', role: 'customer', created_at: now, updated_at: now },
            // Driver users
            { id: 9, company_id: 1, name: 'Driver Vikram', email: 'vikram@swiftcourier.com', phone: '9000000009', role: 'customer', created_at: now, updated_at: now },
            { id: 10, company_id: 1, name: 'Driver Suresh', email: 'suresh@swiftcourier.com', phone: '9000000010', role: 'customer', created_at: now, updated_at: now },
            { id: 11, company_id: 2, name: 'Driver Kiran', email: 'kiran@urbanfleet.com', phone: '9000000011', role: 'customer', created_at: now, updated_at: now },
            { id: 12, company_id: 2, name: 'Driver Arjun', email: 'arjun@urbanfleet.com', phone: '9000000012', role: 'customer', created_at: now, updated_at: now },
            // Independent driver users
            { id: 13, company_id: null, name: 'Freelancer Raj', email: 'raj.freelance@gmail.com', phone: '9000000013', role: 'customer', created_at: now, updated_at: now },
            { id: 14, company_id: null, name: 'Freelancer Meera', email: 'meera.freelance@gmail.com', phone: '9000000014', role: 'customer', created_at: now, updated_at: now },
        ]);

        // ── Drivers ──
        await queryInterface.bulkInsert('drivers', [
            // SwiftCourier employed
            { id: 1, user_id: 9, company_id: 1, type: 'EMPLOYED', status: 'AVAILABLE', verification_status: 'VERIFIED', license_number: 'MH01-DL-001', created_at: now, updated_at: now },
            { id: 2, user_id: 10, company_id: 1, type: 'EMPLOYED', status: 'AVAILABLE', verification_status: 'VERIFIED', license_number: 'MH01-DL-002', created_at: now, updated_at: now },
            // UrbanFleet employed
            { id: 3, user_id: 11, company_id: 2, type: 'EMPLOYED', status: 'OFFLINE', verification_status: 'VERIFIED', license_number: 'DL01-DL-001', created_at: now, updated_at: now },
            { id: 4, user_id: 12, company_id: 2, type: 'EMPLOYED', status: 'AVAILABLE', verification_status: 'VERIFIED', license_number: 'DL01-DL-002', created_at: now, updated_at: now },
            // Independent
            { id: 5, user_id: 13, company_id: null, type: 'INDEPENDENT', status: 'AVAILABLE', verification_status: 'VERIFIED', license_number: 'KA01-DL-001', created_at: now, updated_at: now },
            { id: 6, user_id: 14, company_id: null, type: 'INDEPENDENT', status: 'OFFLINE', verification_status: 'PENDING', license_number: 'KA01-DL-002', created_at: now, updated_at: now },
        ]);

        // ── Vehicles ──
        await queryInterface.bulkInsert('vehicles', [
            { id: 1, company_id: 1, driver_id: 1, plate_number: 'MH01-AB-1234', type: 'VAN', capacity_kg: 500.00, status: 'ACTIVE', created_at: now, updated_at: now },
            { id: 2, company_id: 1, driver_id: 2, plate_number: 'MH01-CD-5678', type: 'BIKE', capacity_kg: 20.00, status: 'ACTIVE', created_at: now, updated_at: now },
            { id: 3, company_id: 2, driver_id: 3, plate_number: 'DL01-EF-9012', type: 'TRUCK', capacity_kg: 2000.00, status: 'ACTIVE', created_at: now, updated_at: now },
            { id: 4, company_id: 2, driver_id: 4, plate_number: 'DL01-GH-3456', type: 'VAN', capacity_kg: 800.00, status: 'ACTIVE', created_at: now, updated_at: now },
        ]);

        // ── Hubs ──
        await queryInterface.bulkInsert('hubs', [
            { id: 1, company_id: 1, name: 'SwiftCourier Mumbai Central', address: 'Mumbai Central Station Area', lat: 18.9690, lng: 72.8196, created_at: now, updated_at: now },
            { id: 2, company_id: 1, name: 'SwiftCourier Andheri', address: 'Andheri West, Mumbai', lat: 19.1197, lng: 72.8464, created_at: now, updated_at: now },
            { id: 3, company_id: 2, name: 'UrbanFleet Connaught Place', address: 'CP, New Delhi', lat: 28.6315, lng: 77.2167, created_at: now, updated_at: now },
            { id: 4, company_id: 2, name: 'UrbanFleet Nehru Place', address: 'Nehru Place, New Delhi', lat: 28.5491, lng: 77.2533, created_at: now, updated_at: now },
        ]);

        // ── Orders ──
        await queryInterface.bulkInsert('orders', [
            // SwiftCourier orders
            { id: 1, company_id: 1, customer_id: 4, tracking_code: uuidv4(), status: 'UNASSIGNED', weight_kg: 2.50, pickup_lat: 18.9690, pickup_lng: 72.8196, pickup_address: 'Mumbai Central', delivery_lat: 19.0760, delivery_lng: 72.8777, delivery_address: 'Bandra West', priority: 'NORMAL', created_at: now, updated_at: now },
            { id: 2, company_id: 1, customer_id: 5, tracking_code: uuidv4(), status: 'LISTED', listed_price: 150.00, weight_kg: 5.00, pickup_lat: 19.1197, pickup_lng: 72.8464, pickup_address: 'Andheri West', delivery_lat: 19.2183, delivery_lng: 72.9781, delivery_address: 'Thane', priority: 'HIGH', created_at: now, updated_at: now },
            { id: 3, company_id: 1, customer_id: 4, tracking_code: uuidv4(), status: 'ASSIGNED', weight_kg: 1.00, pickup_lat: 19.0760, pickup_lng: 72.8777, pickup_address: 'Bandra', delivery_lat: 18.9220, delivery_lng: 72.8347, delivery_address: 'Colaba', priority: 'URGENT', created_at: now, updated_at: now },
            // UrbanFleet orders
            { id: 4, company_id: 2, customer_id: 8, tracking_code: uuidv4(), status: 'UNASSIGNED', weight_kg: 10.00, pickup_lat: 28.6315, pickup_lng: 77.2167, pickup_address: 'Connaught Place', delivery_lat: 28.5355, delivery_lng: 77.2100, delivery_address: 'Saket', priority: 'NORMAL', created_at: now, updated_at: now },
            { id: 5, company_id: 2, customer_id: 8, tracking_code: uuidv4(), status: 'DELIVERED', weight_kg: 3.50, pickup_lat: 28.5491, pickup_lng: 77.2533, pickup_address: 'Nehru Place', delivery_lat: 28.6129, delivery_lng: 77.2295, delivery_address: 'India Gate', priority: 'LOW', created_at: now, updated_at: now },
            { id: 6, company_id: 1, customer_id: 5, tracking_code: uuidv4(), status: 'CANCELLED', weight_kg: 0.50, pickup_lat: 19.0178, pickup_lng: 72.8478, pickup_address: 'Dadar', delivery_lat: 19.0544, delivery_lng: 72.8406, delivery_address: 'Mahim', priority: 'LOW', notes: 'Customer cancelled - wrong address', created_at: now, updated_at: now },
        ]);

        // ── Assignment for order #3 (ASSIGNED) ──
        await queryInterface.bulkInsert('assignments', [
            { id: 1, order_id: 3, driver_id: 1, vehicle_id: 1, assigned_by: 3, source: 'DIRECT', created_at: now, updated_at: now },
        ]);

        // ── Delivery Events for order #3 ──
        await queryInterface.bulkInsert('delivery_events', [
            { id: 1, assignment_id: 1, event_type: 'ASSIGNED', timestamp: now, notes: 'Assigned by dispatcher Priya' },
        ]);

        // ── Bid on order #2 (LISTED) ──
        await queryInterface.bulkInsert('bids', [
            { id: 1, order_id: 2, driver_id: 5, offered_price: 120.00, status: 'PENDING', message: 'I can pick this up on my route to Thane', created_at: now, updated_at: now },
        ]);

        // ── Driver Route (independent driver) ──
        const departure = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
        await queryInterface.bulkInsert('driver_routes', [
            { id: 1, driver_id: 5, start_lat: 19.0760, start_lng: 72.8777, end_lat: 19.2183, end_lng: 72.9781, departure_time: departure, is_active: true, created_at: now, updated_at: now },
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
