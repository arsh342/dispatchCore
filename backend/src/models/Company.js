/**
 * Company Model
 *
 * Multi-tenant boundary. Each company has its own isolated workspace
 * with its own users, drivers, hubs, orders, and vehicles.
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
            address: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            plan_type: {
                type: DataTypes.ENUM('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'),
                defaultValue: 'FREE',
                allowNull: false,
            },
        },
        {
            tableName: 'companies',
            timestamps: true,
            underscored: true,
        },
    );

    Company.associate = (models) => {
        Company.hasMany(models.User, { foreignKey: 'company_id', as: 'users' });
        Company.hasMany(models.Driver, { foreignKey: 'company_id', as: 'drivers' });
        Company.hasMany(models.Hub, { foreignKey: 'company_id', as: 'hubs' });
        Company.hasMany(models.Order, { foreignKey: 'company_id', as: 'orders' });
        Company.hasMany(models.Vehicle, { foreignKey: 'company_id', as: 'vehicles' });
    };

    return Company;
};
