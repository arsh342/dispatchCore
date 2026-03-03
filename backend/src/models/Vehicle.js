/**
 * Vehicle Model
 *
 * Fleet assets belonging to a company, assigned to drivers.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Vehicle = sequelize.define(
        'Vehicle',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            company_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'companies', key: 'id' },
            },
            driver_id: {
                type: DataTypes.INTEGER,
                allowNull: true, // a vehicle may not be assigned yet
                references: { model: 'drivers', key: 'id' },
            },
            plate_number: {
                type: DataTypes.STRING(20),
                allowNull: false,
                unique: true,
            },
            type: {
                type: DataTypes.ENUM('BIKE', 'VAN', 'TRUCK'),
                allowNull: false,
            },
            capacity_kg: {
                type: DataTypes.DECIMAL(8, 2),
                allowNull: false,
                validate: { min: 0 },
            },
            status: {
                type: DataTypes.ENUM('ACTIVE', 'MAINTENANCE', 'RETIRED'),
                defaultValue: 'ACTIVE',
                allowNull: false,
            },
        },
        {
            tableName: 'vehicles',
            timestamps: true,
            underscored: true,
            indexes: [
                { fields: ['plate_number'], unique: true },
                { fields: ['company_id', 'status'] },
            ],
        },
    );

    Vehicle.associate = (models) => {
        Vehicle.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
        Vehicle.belongsTo(models.Driver, { foreignKey: 'driver_id', as: 'driver' });
    };

    return Vehicle;
};
