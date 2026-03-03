/**
 * Hub Model
 *
 * Warehouses and pickup points owned by a company.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Hub = sequelize.define(
        'Hub',
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
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            address: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            lat: {
                type: DataTypes.DECIMAL(10, 7),
                allowNull: false,
                validate: { min: -90, max: 90 },
            },
            lng: {
                type: DataTypes.DECIMAL(10, 7),
                allowNull: false,
                validate: { min: -180, max: 180 },
            },
        },
        {
            tableName: 'hubs',
            timestamps: true,
            underscored: true,
            indexes: [{ fields: ['company_id'] }],
        },
    );

    Hub.associate = (models) => {
        Hub.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    };

    return Hub;
};
