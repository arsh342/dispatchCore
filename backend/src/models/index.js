/**
 * Sequelize Model Index
 *
 * Initializes Sequelize, registers all models, and sets up associations.
 * This is the single entry point for all database access.
 */

const { Sequelize } = require('sequelize');
const env = require('../config/env');
const logger = require('../config/logger');

// Create Sequelize instance
const sequelize = new Sequelize(env.db.name, env.db.user, env.db.pass, {
    host: env.db.host,
    port: env.db.port,
    dialect: 'mysql',
    logging: env.nodeEnv === 'development' ? (msg) => logger.debug(msg) : false,
    pool: {
        min: 2,
        max: 10,
        acquire: 30000,
        idle: 10000,
    },
    define: {
        timestamps: true,
        underscored: true,
        freezeTableName: false,
    },
});

// Register models
const models = {
    Company: require('./Company')(sequelize),
    User: require('./User')(sequelize),
    Driver: require('./Driver')(sequelize),
    DriverRoute: require('./DriverRoute')(sequelize),
    Vehicle: require('./Vehicle')(sequelize),
    Hub: require('./Hub')(sequelize),
    Order: require('./Order')(sequelize),
    Bid: require('./Bid')(sequelize),
    Assignment: require('./Assignment')(sequelize),
    RouteStop: require('./RouteStop')(sequelize),
    DriverLocationLog: require('./DriverLocationLog')(sequelize),
    DeliveryEvent: require('./DeliveryEvent')(sequelize),
};

// Setup associations
Object.values(models).forEach((model) => {
    if (typeof model.associate === 'function') {
        model.associate(models);
    }
});

module.exports = {
    sequelize,
    Sequelize,
    ...models,
};
