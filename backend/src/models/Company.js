/**
 * Company Model
 *
 * Multi-tenant boundary. Each company has its own isolated workspace
 * with its own drivers, hubs, orders, and vehicles.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Company = sequelize.define(
        'Company',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
                validate: {
                    notEmpty: { msg: 'Company name cannot be empty' },
                },
            },
            email: {
                type: DataTypes.STRING(255),
                allowNull: true,
                unique: true,
                validate: {
                    isEmail: { msg: 'Must be a valid email address' },
                },
            },
            password_hash: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            location: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            address: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            contact_name: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            phone: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            plan_type: {
                type: DataTypes.ENUM('STARTER', 'GROWTH', 'ENTERPRISE'),
                defaultValue: 'STARTER',
                allowNull: false,
            },
            notification_preferences: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            appearance_preferences: {
                type: DataTypes.JSON,
                allowNull: true,
            },
        },
        {
            tableName: 'companies',
            timestamps: true,
            underscored: true,
            indexes: [{ fields: ['email'], unique: true }, { fields: ['plan_type'] }],
        },
    );

    Company.associate = (models) => {
        Company.hasMany(models.Driver, { foreignKey: 'company_id', as: 'drivers' });
        Company.hasMany(models.Hub, { foreignKey: 'company_id', as: 'hubs' });
        Company.hasMany(models.Order, { foreignKey: 'company_id', as: 'orders' });
        Company.hasMany(models.Vehicle, { foreignKey: 'company_id', as: 'vehicles' });
        Company.hasMany(models.Assignment, {
            foreignKey: 'assigned_by_company_id',
            as: 'assignmentsCreated',
        });
    };

    return Company;
};
