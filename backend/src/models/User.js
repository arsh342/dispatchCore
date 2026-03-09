/**
 * User Model
 *
 * All human actors on the platform: SuperAdmin, Dispatcher, Customer.
 * Drivers have a separate extended profile in the Driver model.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // null for superadmin
        references: { model: 'companies', key: 'id' },
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Name cannot be empty' },
        },
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: { msg: 'Must be a valid email address' },
        },
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM('superadmin', 'dispatcher', 'customer'),
        allowNull: false,
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      underscored: true,
      indexes: [{ fields: ['email'], unique: true }, { fields: ['company_id', 'role'] }],
    },
  );

  User.associate = (models) => {
    User.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    User.hasMany(models.Order, { foreignKey: 'customer_id', as: 'customerOrders' });
    User.hasOne(models.Driver, { foreignKey: 'user_id', as: 'driverProfile' });
  };

  return User;
};
