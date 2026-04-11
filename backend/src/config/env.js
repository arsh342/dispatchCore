/**
 * Environment Configuration
 *
 * Validates all required environment variables on server boot using Joi.
 * If any required variable is missing or invalid, the process crashes
 * immediately with a clear error message — fail fast, fail loud.
 */

const Joi = require('joi');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const backendRoot = path.resolve(__dirname, '..', '..');
const runtimeNodeEnv = process.env.NODE_ENV || 'development';
const baseEnvPath = path.resolve(backendRoot, '.env');
const modeEnvPath = path.resolve(backendRoot, `.env.${runtimeNodeEnv}`);

// Load base env first, then overlay mode-specific values when present.
dotenv.config({ path: baseEnvPath });
if (fs.existsSync(modeEnvPath)) {
    dotenv.config({ path: modeEnvPath, override: true });
}

const envSchema = Joi.object({
    // Server
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    PORT: Joi.number().default(5000),

    // Database
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().default(3306),
    DB_NAME: Joi.string().required(),
    DB_USER: Joi.string().required(),
    DB_PASS: Joi.string().allow('').default(''),
    DB_SSL_ENABLED: Joi.boolean()
        .truthy('true', '1')
        .falsy('false', '0')
        .optional(),
    DB_SSL_CA_PATH: Joi.string().allow('').optional(),
    DB_SSL_REJECT_UNAUTHORIZED: Joi.boolean()
        .truthy('true', '1')
        .falsy('false', '0')
        .optional(),

    // WebSocket
    WS_CORS_ORIGIN: Joi.string().default('http://localhost:5173'),

    // Frontend
    FRONTEND_URL: Joi.string().default('http://localhost:5173'),

    // Maintenance / cutover mode
    MAINTENANCE_MODE: Joi.boolean()
        .truthy('true', '1')
        .falsy('false', '0')
        .default(false),
    MAINTENANCE_BYPASS_TOKEN: Joi.string().allow('').default(''),

    // JWT Authentication (CE-02)
    JWT_ACCESS_SECRET: Joi.string()
        .min(32)
        .default('dev-access-secret-change-in-production'),
    JWT_REFRESH_SECRET: Joi.string()
        .min(32)
        .default('dev-refresh-secret-change-in-production'),
})
    .unknown() // Allow other system env vars
    .required();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
    console.error(`\n❌ Environment validation error:\n   ${error.message}\n`);
    console.error('   Copy .env.example to .env and fill in the required values.\n');
    process.exit(1);
}

const dbSslEnabled =
    envVars.DB_SSL_ENABLED !== undefined
        ? envVars.DB_SSL_ENABLED
        : envVars.NODE_ENV === 'production';
const dbSslCaPath = envVars.DB_SSL_CA_PATH || null;
const dbSslRejectUnauthorized =
    envVars.DB_SSL_REJECT_UNAUTHORIZED !== undefined
        ? envVars.DB_SSL_REJECT_UNAUTHORIZED
        : true;

module.exports = {
    nodeEnv: envVars.NODE_ENV,
    port: envVars.PORT,
    db: {
        host: envVars.DB_HOST,
        port: envVars.DB_PORT,
        name: envVars.DB_NAME,
        user: envVars.DB_USER,
        pass: envVars.DB_PASS,
        ssl: {
            enabled: dbSslEnabled,
            caPath: dbSslCaPath,
            rejectUnauthorized: dbSslRejectUnauthorized,
        },
    },
    wsCorsOrigin: envVars.WS_CORS_ORIGIN,
    frontendUrl: envVars.FRONTEND_URL,
    maintenance: {
        enabled: envVars.MAINTENANCE_MODE,
        bypassToken: envVars.MAINTENANCE_BYPASS_TOKEN || null,
    },
    jwt: {
        accessSecret: envVars.JWT_ACCESS_SECRET,
        refreshSecret: envVars.JWT_REFRESH_SECRET,
    },
};
