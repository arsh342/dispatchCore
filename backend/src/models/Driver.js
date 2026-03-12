/**
 * Driver Model
 *
 * Extended profile for drivers (both employed and independent).
 * Employed drivers belong to a company; independent drivers have company_id = null.
 *
 * Status transitions:
 *   OFFLINE → AVAILABLE → BUSY → AVAILABLE → OFFLINE
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Driver = sequelize.define(
        'Driver',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            company_id: {
                type: DataTypes.INTEGER,
                allowNull: true, // null for independent drivers
                references: { model: 'companies', key: 'id' },
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            email: {
                type: DataTypes.STRING(255),
                allowNull: true,
                unique: true,
                validate: {
                    isEmail: { msg: 'Must be a valid email address' },
                },
            },
            phone: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            password_hash: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            type: {
                type: DataTypes.ENUM('EMPLOYED', 'INDEPENDENT'),
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM('AVAILABLE', 'BUSY', 'OFFLINE'),
                defaultValue: 'OFFLINE',
                allowNull: false,
            },
            verification_status: {
                type: DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
                defaultValue: 'PENDING',
                allowNull: false,
            },
            license_number: {
                type: DataTypes.STRING(50),
                allowNull: true,
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
            tableName: 'drivers',
            timestamps: true,
            underscored: true,
            indexes: [
                { fields: ['email'], unique: true },
                { fields: ['company_id', 'status'] },
                { fields: ['type', 'status'] },
            ],
        },
    );

    Driver.associate = (models) => {
        Driver.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
        Driver.hasMany(models.DriverRoute, { foreignKey: 'driver_id', as: 'routes' });
        Driver.hasMany(models.Bid, { foreignKey: 'driver_id', as: 'bids' });
        Driver.hasMany(models.Assignment, { foreignKey: 'driver_id', as: 'assignments' });
        Driver.hasMany(models.DriverLocationLog, { foreignKey: 'driver_id', as: 'locationLogs' });
        Driver.hasOne(models.Vehicle, { foreignKey: 'driver_id', as: 'vehicle' });
    };

    return Driver;
};
