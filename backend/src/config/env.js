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

// Load .env file from backend root
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

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

    // WebSocket
    WS_CORS_ORIGIN: Joi.string().default('http://localhost:5173'),

    // Frontend
    FRONTEND_URL: Joi.string().default('http://localhost:5173'),
})
    .unknown() // Allow other system env vars
    .required();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
    console.error(`\n❌ Environment validation error:\n   ${error.message}\n`);
    console.error('   Copy .env.example to .env and fill in the required values.\n');
    process.exit(1);
}

module.exports = {
    nodeEnv: envVars.NODE_ENV,
    port: envVars.PORT,
    db: {
        host: envVars.DB_HOST,
        port: envVars.DB_PORT,
        name: envVars.DB_NAME,
        user: envVars.DB_USER,
        pass: envVars.DB_PASS,
    },
    wsCorsOrigin: envVars.WS_CORS_ORIGIN,
    frontendUrl: envVars.FRONTEND_URL,
};
