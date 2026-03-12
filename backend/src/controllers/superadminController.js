/**
 * SuperAdmin Controller
 *
 * Platform-wide aggregation endpoints for the SuperAdmin dashboard.
 * No tenant scoping — these span all companies.
 */

const { Company, Order, Driver, Assignment, SuperadminSetting } = require('../models');
const { success } = require('../utils/response');
const { ORDER_STATUS } = require('../utils/constants');
const { Op } = require('sequelize');

const getCreatedAt = (record) => record?.createdAt ?? record?.created_at ?? null;
const defaultNotificationPreferences = {
  platform_alerts: true,
  company_registrations: true,
  driver_verifications: true,
  daily_summary: false,
};
const defaultAppearancePreferences = {
  theme: 'dark',
};

const getOrCreateSuperadminSettings = async () => {
  const [settings] = await SuperadminSetting.findOrCreate({
    where: { id: 1 },
    defaults: {
      name: 'Platform Admin',
      email: process.env.SUPERADMIN_EMAIL || 'admin@dispatchcore.com',
      notification_preferences: defaultNotificationPreferences,
      appearance_preferences: defaultAppearancePreferences,
    },
  });

  return settings;
};

/**
 * GET /api/superadmin/stats
 * Platform-wide KPIs
 */
const getPlatformStats = async (req, res, next) => {
  try {
    const [
      totalCompanies,
      totalOrders,
      totalDrivers,
      totalDelivered,
      totalActiveOrders,
      totalListedOrders,
    ] = await Promise.all([
      Company.count(),
      Order.count(),
      Driver.count(),
      Order.count({ where: { status: ORDER_STATUS.DELIVERED } }),
      Order.count({
        where: {
          status: {
            [Op.in]: [ORDER_STATUS.ASSIGNED, ORDER_STATUS.PICKED_UP, ORDER_STATUS.EN_ROUTE],
          },
        },
      }),
      Order.count({ where: { status: ORDER_STATUS.LISTED } }),
    ]);

    return success(res, {
      totalCompanies,
      totalOrders,
      totalDrivers,
      totalDelivered,
      totalActiveOrders,
      totalListedOrders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/superadmin/companies
 * List all companies with order/driver counts
 */
const getCompanies = async (req, res, next) => {
  try {
    const companies = await Company.findAll({
      order: [['created_at', 'DESC']],
    });

    const result = [];

    for (const company of companies) {
      const [orderCount, driverCount] = await Promise.all([
        Order.count({ where: { company_id: company.id } }),
        Driver.count({ where: { company_id: company.id } }),
      ]);

      result.push({
        id: company.id,
        name: company.name,
        address: company.address,
        location: company.location || company.address,
        planType: company.plan_type,
        createdAt: getCreatedAt(company),
        orderCount,
        driverCount,
      });
    }

    return success(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/superadmin/drivers
 * List all drivers across the platform with user + company info
 */
const getAllDrivers = async (req, res, next) => {
  try {
    const drivers = await Driver.findAll({
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'], required: false },
      ],
      order: [['created_at', 'DESC']],
    });

    const result = [];
    for (const d of drivers) {
      const activeAssignments = await Assignment.count({
        where: { driver_id: d.id },
        include: [
          {
            model: Order,
            as: 'order',
            where: {
              status: {
                [Op.in]: [ORDER_STATUS.ASSIGNED, ORDER_STATUS.PICKED_UP, ORDER_STATUS.EN_ROUTE],
              },
            },
          },
        ],
      });
      const completedDeliveries = await Assignment.count({
        where: { driver_id: d.id },
        include: [{ model: Order, as: 'order', where: { status: ORDER_STATUS.DELIVERED } }],
      });

      result.push({
        id: d.id,
        name: d.name ?? 'Unknown',
        email: d.email ?? '',
        phone: d.phone ?? '',
        type: d.type,
        status: d.status,
        verificationStatus: d.verification_status,
        licenseNumber: d.license_number,
        companyName: d.company?.name ?? null,
        companyId: d.company_id,
        activeAssignments,
        completedDeliveries,
        createdAt: getCreatedAt(d),
      });
    }

    return success(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/superadmin/orders
 * List all orders across the platform with company info
 */
const getAllOrders = async (req, res, next) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const where = {};
    if (status) where.status = status;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const { count: total, rows: orders } = await Order.findAndCountAll({
      where,
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'], required: false }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset,
    });

    const result = orders.map((o) => ({
      id: o.id,
      trackingCode: o.tracking_code,
      status: o.status,
      priority: o.priority,
      pickupAddress: o.pickup_address,
      deliveryAddress: o.delivery_address,
      weightKg: o.weight_kg,
      listedPrice: o.listed_price,
      companyName: o.company?.name ?? 'N/A',
      companyId: o.company_id,
      createdAt: getCreatedAt(o),
    }));

    return success(res, result, {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (error) {
    next(error);
  }
};

const getSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSuperadminSettings();

    return success(res, {
      name: settings.name,
      email: settings.email,
      notification_preferences:
        settings.notification_preferences ?? defaultNotificationPreferences,
      appearance_preferences:
        settings.appearance_preferences ?? defaultAppearancePreferences,
      login_email: process.env.SUPERADMIN_EMAIL || settings.email,
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSuperadminSettings();
    const { name, email, notification_preferences, appearance_preferences } = req.body;

    await settings.update({
      name: name ?? settings.name,
      email: email ?? settings.email,
      notification_preferences:
        notification_preferences ?? settings.notification_preferences ?? defaultNotificationPreferences,
      appearance_preferences:
        appearance_preferences ?? settings.appearance_preferences ?? defaultAppearancePreferences,
    });

    return success(res, {
      name: settings.name,
      email: settings.email,
      notification_preferences:
        settings.notification_preferences ?? defaultNotificationPreferences,
      appearance_preferences:
        settings.appearance_preferences ?? defaultAppearancePreferences,
      login_email: process.env.SUPERADMIN_EMAIL || settings.email,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlatformStats,
  getCompanies,
  getAllDrivers,
  getAllOrders,
  getSettings,
  updateSettings,
};
