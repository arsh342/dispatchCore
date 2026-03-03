/**
 * Database Configuration
 *
 * Sequelize connection config with connection pooling.
 * Supports development, test, and production environments.
 * Used by both the application and Sequelize CLI (via .sequelizerc).
 */

const env = require('./env');

const baseConfig = {
    username: env.db.user,
    password: env.db.pass,
    database: env.db.name,
    host: env.db.host,
    port: env.db.port,
    dialect: 'mysql',
    pool: {
        min: 2,
        max: 10,
        acquire: 30000,
        idle: 10000,
    },
    logging: env.nodeEnv === 'development' ? console.log : false,
    define: {
        timestamps: true,
        underscored: true, // snake_case column names
        freezeTableName: false, // Sequelize will pluralize table names
    },
};

module.exports = {
    development: {
        ...baseConfig,
    },
    test: {
        ...baseConfig,
        database: `${env.db.name}_test`,
        logging: false,
    },
    production: {
        ...baseConfig,
        logging: false,
        pool: {
            min: 5,
            max: 20,
            acquire: 60000,
            idle: 10000,
        },
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
    },
};
